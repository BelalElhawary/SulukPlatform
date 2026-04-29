from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from database import get_session
from pydantic import BaseModel
from models import Item
from auth import get_current_user

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    price: Optional[float] = None


router = APIRouter(prefix="/items", tags=["items"])

@router.post("/", response_model=Item)
def create_item(item: Item, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    item.user_id = current_user.id
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.get("/", response_model=List[Item])
def read_items(session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    items = session.exec(select(Item).where(Item.user_id == current_user.id)).all()
    return items

@router.get("/{item_id}", response_model=Item)
def read_item(item_id: int, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    item = session.get(Item, item_id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.put("/{item_id}", response_model=Item)
def update_item(item_id: int, item_update: ItemUpdate, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    db_item = session.get(Item, item_id)
    if not db_item or db_item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item_data = item_update.model_dump(exclude_unset=True)
    for key, value in item_data.items():
        setattr(db_item, key, value)
        
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item
