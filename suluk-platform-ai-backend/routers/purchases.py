from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
from database import get_session
from models import Purchase, PurchaseItem, Client
from datetime import datetime
from auth import get_current_user

router = APIRouter(prefix="/purchases", tags=["purchases"])

class PurchaseItemCreate(BaseModel):
    item_id: int
    quantity: int
    unit_price: float

class PurchaseCreate(BaseModel):
    client_id: int
    items: List[PurchaseItemCreate]
    created_at: Optional[str] = None

class PurchaseUpdate(BaseModel):
    created_at: Optional[str] = None

class PurchaseRead(BaseModel):
    id: int
    client_id: int
    total_amount: float
    created_at: str
    client_name: str

@router.post("/", response_model=Purchase)
def create_purchase(purchase_data: PurchaseCreate, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    # Calculate total
    total_amount = sum(item.quantity * item.unit_price for item in purchase_data.items)
    
    # Verify Client Ownership
    db_client = session.get(Client, purchase_data.client_id)
    if not db_client or db_client.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this client")

    # Create Purchase
    db_purchase = Purchase(client_id=purchase_data.client_id, total_amount=total_amount, user_id=current_user.id)
    
    if purchase_data.created_at:
        try:
            db_purchase.created_at = datetime.fromisoformat(purchase_data.created_at.replace("Z", "+00:00"))
        except ValueError:
            pass # fallback to default if parsing fails

    session.add(db_purchase)
    session.commit()
    session.refresh(db_purchase)

    # Create Purchase Items
    for item_data in purchase_data.items:
        db_item = PurchaseItem(
            purchase_id=db_purchase.id,
            item_id=item_data.item_id,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price
        )
        session.add(db_item)
    
    session.commit()
    return db_purchase

@router.get("/", response_model=List[PurchaseRead])
def read_purchases(session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    purchases = session.exec(select(Purchase).where(Purchase.user_id == current_user.id)).all()
    result = []
    for p in purchases:
        # Lazy load client for name
        client = session.get(Client, p.client_id)
        result.append(PurchaseRead(
            id=p.id,
            client_id=p.client_id,
            total_amount=p.total_amount,
            created_at=str(p.created_at),
            client_name=client.name if client else "Unknown"
        ))
    return result

@router.put("/{purchase_id}", response_model=Purchase)
def update_purchase(purchase_id: int, purchase_update: PurchaseUpdate, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    db_purchase = session.get(Purchase, purchase_id)
    if not db_purchase or db_purchase.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Purchase not found")
        
    if purchase_update.created_at:
        try:
            db_purchase.created_at = datetime.fromisoformat(purchase_update.created_at.replace("Z", "+00:00"))
        except ValueError:
            pass
            
    session.add(db_purchase)
    session.commit()
    session.refresh(db_purchase)
    return db_purchase
