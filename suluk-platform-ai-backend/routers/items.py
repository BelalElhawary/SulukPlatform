from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Item
from auth import get_current_user

router = APIRouter(prefix="/items", tags=["items"])

@router.post("/", response_model=Item)
def create_item(item: Item, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.get("/", response_model=List[Item])
def read_items(session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    items = session.exec(select(Item)).all()
    return items

@router.get("/{item_id}", response_model=Item)
def read_item(item_id: int, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    item = session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
