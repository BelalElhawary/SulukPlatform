from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import List, Dict, Any
from database import get_session
from models import Client, Purchase, PurchaseItem, Item
from auth import get_current_user
import httpx
import json
import asyncio

router = APIRouter(prefix="/analysis", tags=["analysis"])

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "gpt-oss:20b" 

def get_client_history(session: Session, client_id: int):
    client = session.get(Client, client_id)
    if not client:
        return None, None
        
    purchases = session.exec(select(Purchase).where(Purchase.client_id == client_id)).all()
    return client, purchases

def aggregate_data(session: Session, purchases: List[Purchase]):
    if not purchases:
        return 0, {}, [], []

    total_spent = sum(p.total_amount for p in purchases)
    
    # Item Analysis
    item_counts = {}
    spending_by_date = {}

    for p in purchases:
        # Spending by date
        date_str = p.created_at.date().isoformat()
        spending_by_date[date_str] = spending_by_date.get(date_str, 0) + p.total_amount

        # Items
        p_items = session.exec(select(PurchaseItem).where(PurchaseItem.purchase_id == p.id)).all()
        for pi in p_items:
            item = session.get(Item, pi.item_id)
            if item:
                item_counts[item.name] = item_counts.get(item.name, 0) + pi.quantity

    top_items = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    chart_data = [{"date": k, "amount": v} for k, v in sorted(spending_by_date.items())]
    
    return total_spent, item_counts, top_items, chart_data

@router.get("/models")
async def list_models(session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:11434/api/tags")
            if response.status_code == 200:
                data = response.json()
                # Extract model names
                models = [model["name"] for model in data.get("models", [])]
                return {"models": models}
            else:
                return {"models": [MODEL_NAME]} # Fallback
    except Exception as e:
        print(f"Error fetching models: {e}")
        return {"models": [MODEL_NAME]} # Fallback

@router.get("/{client_id}")
async def get_analysis_data(client_id: int, lang: str = "en", session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    client, purchases = get_client_history(session, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if not purchases:
         return {
            "client_name": client.name,
            "total_spent": 0,
            "purchase_count": 0,
            "chart_data": [],
            "top_items": []
        }

    total_spent, _, top_items, chart_data = aggregate_data(session, purchases)

    return {
        "client_name": client.name,
        "total_spent": total_spent,
        "purchase_count": len(purchases),
        "chart_data": chart_data,
        "top_items": [{"name": k, "value": v} for k, v in top_items]
    }

@router.get("/{client_id}/stream")
async def stream_analysis(client_id: int, lang: str = "en", model: str = MODEL_NAME, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    client, purchases = get_client_history(session, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if not purchases:
        async def empty_generator():
            msg = "No purchase history available for analysis." if lang == "en" else "لا يوجد سجل مشتريات متاح للتحليل."
            yield msg
        return StreamingResponse(empty_generator(), media_type="text/plain")

    total_spent, _, top_items, chart_data = aggregate_data(session, purchases)

    # Prepare Prompt
    lang_instruction = "Answer in English." if lang == "en" else "Answer in Arabic. Layout the response properly in Markdown."
    
    prompt = f"""
    Analyze the following client purchase history and provide insights on their spending strategy and personality.
    Client: {client.name}
    Total Spent: ${total_spent:.2f}
    Total Purchases: {len(purchases)}
    Top Items Bought: {', '.join([f'{name} ({count})' for name, count in top_items])}
    Spending Pattern (Date: Amount): {json.dumps(chart_data)}

    Please provided a psychological profile of this customer and actionable recommendations for a business to increase sales with them.
    {lang_instruction}
    """

    async def generate():
        try:
            async with httpx.AsyncClient(timeout=120.0) as client_http:
                async with client_http.stream(
                    "POST",
                    OLLAMA_URL,
                    json={
                        "model": model, # Use selected model
                        "prompt": prompt,
                        "stream": True 
                    }
                ) as response:
                    async for chunk in response.aiter_lines():
                        if chunk:
                            try:
                                data = json.loads(chunk)
                                if "response" in data:
                                    yield data["response"]
                            except json.JSONDecodeError:
                                pass
        except Exception as e:
            err_msg = f"\n\n**Error evaluating AI response:** {str(e)}"
            yield err_msg

    return StreamingResponse(generate(), media_type="text/plain")
