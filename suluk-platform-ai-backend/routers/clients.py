from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Client
from auth import get_current_user

router = APIRouter(prefix="/clients", tags=["clients"])

@router.post("/", response_model=Client)
def create_client(client: Client, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    session.add(client)
    session.commit()
    session.refresh(client)
    return client

@router.get("/", response_model=List[Client])
def read_clients(session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    clients = session.exec(select(Client)).all()
    return clients

@router.get("/{client_id}", response_model=Client)
def read_client(client_id: int, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client
