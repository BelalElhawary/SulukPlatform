from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Client, Purchase, PurchaseItem, Item
from auth import get_current_user
import httpx
import json
from datetime import datetime
import chromadb
import uuid

router = APIRouter(prefix="/analysis", tags=["analysis"])

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "gpt-oss:20b" 

HOLIDAY_CACHE = {}

async def get_holidays(year: int):
    if year in HOLIDAY_CACHE:
        return HOLIDAY_CACHE[year]
    
    holidays = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Fetching for UK and EG
        for country in ["GB", "EG"]:
            try:
                resp = await client.get(f"https://date.nager.at/api/v3/PublicHolidays/{year}/{country}")
                if resp.status_code == 200:
                    data = resp.json()
                    holidays.extend([d["date"] for d in data])
            except Exception as e:
                print(f"Failed to fetch holidays for {country}: {e}")
                pass
    
    unique_dates = set(holidays)
    HOLIDAY_CACHE[year] = unique_dates
    return unique_dates

def get_client_history(session: Session, client_id: int, current_user):
    client = session.get(Client, client_id)
    if not client or client.user_id != current_user.id:
        return None, None
        
    purchases = session.exec(select(Purchase).where(Purchase.client_id == client_id, Purchase.user_id == current_user.id)).all()
    return client, purchases

def aggregate_data(session: Session, purchases: List[Purchase], holiday_dates: set):
    if not purchases:
        return 0, {}, [], [], 0, []

    total_spent = sum(p.total_amount for p in purchases)
    
    item_counts = {}
    spending_by_date = {}
    item_purchase_freq = {}
    holiday_purchases_count = 0

    for p in purchases:
        date_str = p.created_at.date().isoformat()
        spending_by_date[date_str] = spending_by_date.get(date_str, 0) + p.total_amount

        if date_str in holiday_dates:
            holiday_purchases_count += 1

        p_items = session.exec(select(PurchaseItem).where(PurchaseItem.purchase_id == p.id)).all()
        seen_in_this_purchase = set()
        
        for pi in p_items:
            item = session.get(Item, pi.item_id)
            if item:
                item_counts[item.name] = item_counts.get(item.name, 0) + pi.quantity
                if item.name not in seen_in_this_purchase:
                    item_purchase_freq[item.name] = item_purchase_freq.get(item.name, 0) + 1
                    seen_in_this_purchase.add(item.name)

    top_items = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    chart_data = [{"date": k, "amount": v} for k, v in sorted(spending_by_date.items())]
    
    repetitive_items = [{"name": k, "frequency": v} for k, v in item_purchase_freq.items() if v > 1]
    repetitive_items = sorted(repetitive_items, key=lambda x: x["frequency"], reverse=True)[:10]
    
    return total_spent, item_counts, top_items, chart_data, holiday_purchases_count, repetitive_items

@router.get("/models")
async def list_models(session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:11434/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [model["name"] for model in data.get("models", [])]
                return {"models": models}
            else:
                return {"models": [MODEL_NAME]}
    except Exception as e:
        print(f"Error fetching models: {e}")
        return {"models": [MODEL_NAME]}

@router.get("/{client_id}")
async def get_analysis_data(client_id: int, lang: str = "en", session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    client, purchases = get_client_history(session, client_id, current_user)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if not purchases:
         return {
            "client_name": client.name,
            "total_spent": 0,
            "purchase_count": 0,
            "chart_data": [],
            "top_items": [],
            "holiday_purchases": 0,
            "repetitive_purchases": []
        }

    # Gather holiday dates for all years present
    years = set(p.created_at.year for p in purchases)
    holiday_dates = set()
    for y in years:
        holiday_dates.update(await get_holidays(y))

    total_spent, _, top_items, chart_data, holiday_purchases, repetitive_purchases = aggregate_data(session, purchases, holiday_dates)

    return {
        "client_name": client.name,
        "total_spent": total_spent,
        "purchase_count": len(purchases),
        "chart_data": chart_data,
        "top_items": [{"name": k, "value": v} for k, v in top_items],
        "holiday_purchases": holiday_purchases,
        "repetitive_purchases": repetitive_purchases
    }

@router.get("/{client_id}/stream")
async def stream_analysis(client_id: int, lang: str = "en", model: str = MODEL_NAME, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    client, purchases = get_client_history(session, client_id, current_user)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if not purchases:
        async def empty_generator():
            msg = "No purchase history available for analysis." if lang == "en" else "لا يوجد سجل مشتريات متاح للتحليل."
            yield msg
        return StreamingResponse(empty_generator(), media_type="text/plain")

    years = set(p.created_at.year for p in purchases)
    holiday_dates = set()
    for y in years:
        holiday_dates.update(await get_holidays(y))

    total_spent, _, top_items, chart_data, holiday_purchases, repetitive_purchases = aggregate_data(session, purchases, holiday_dates)

    # RAG Implementation
    chroma_client = chromadb.Client()
    collection_name = f"client_{client_id}_{uuid.uuid4().hex}"
    collection = chroma_client.create_collection(name=collection_name)
    
    docs = []
    ids = []
    
    for p in purchases:
        date_str = p.created_at.date().isoformat()
        is_holiday = "holiday" if date_str in holiday_dates else "regular day"
        p_items = session.exec(select(PurchaseItem).where(PurchaseItem.purchase_id == p.id)).all()
        
        item_names = []
        for pi in p_items:
            item = session.get(Item, pi.item_id)
            if item:
                item_names.append(f"{pi.quantity}x {item.name} (${pi.unit_price} each)")
        
        if item_names:
            doc = f"On {date_str} ({is_holiday}), client bought: {', '.join(item_names)}. Total spent for this purchase: ${p.total_amount}."
            docs.append(doc)
            ids.append(str(p.id))

    if docs:
        collection.add(documents=docs, ids=ids)
        # Retrieve the most relevant documents related to behaviors/shopping patterns
        results = collection.query(
            query_texts=["recurring purchases, holiday spending habits, and typical shopping patterns"],
            n_results=min(20, len(docs))
        )
        retrieved_context = "\n".join(results['documents'][0])
    else:
        retrieved_context = "No detailed purchase items found."

    # Send relevant text over rather than huge JSON array
    lang_instruction = "Answer in English." if lang == "en" else "Answer in Arabic. Layout the response properly in Markdown."
    
    prompt = f"""
    Analyze the following client purchase history and provide insights on their spending strategy and personality.
    Client: {client.name}
    Total Spent: ${total_spent:.2f}
    Total Purchases: {len(purchases)}
    Holiday Purchases: {holiday_purchases}
    Top Items Bought: {', '.join([f'{name} ({count})' for name, count in top_items])}
    Repetitive Purchases: {', '.join([f"{item['name']} (frequency: {item['frequency']})" for item in repetitive_purchases])}
    
    Relevant sample transactions:
    {retrieved_context}

    Please provided a psychological profile of this customer and actionable recommendations for a business to increase sales with them. Focus on repetitive items and holidays.
    {lang_instruction}
    """

    async def generate():
        try:
            async with httpx.AsyncClient(timeout=120.0) as client_http:
                async with client_http.stream(
                    "POST",
                    OLLAMA_URL,
                    json={
                        "model": model, 
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
        finally:
            try:
                chroma_client.delete_collection(collection_name)
            except:
                pass


    return StreamingResponse(generate(), media_type="text/plain")
