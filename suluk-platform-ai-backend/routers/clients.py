from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
from database import get_session
from models import Client
from auth import get_current_user

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


router = APIRouter(prefix="/clients", tags=["clients"])

@router.post("/", response_model=Client)
def create_client(client: Client, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    client.user_id = current_user.id
    session.add(client)
    session.commit()
    session.refresh(client)
    return client

@router.get("/", response_model=List[Client])
def read_clients(session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    clients = session.exec(select(Client).where(Client.user_id == current_user.id)).all()
    return clients

@router.get("/{client_id}", response_model=Client)
def read_client(client_id: int, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    client = session.get(Client, client_id)
    if not client or client.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.put("/{client_id}", response_model=Client)
def update_client(client_id: int, client_update: ClientUpdate, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    db_client = session.get(Client, client_id)
    if not db_client or db_client.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client_data = client_update.model_dump(exclude_unset=True)
    for key, value in client_data.items():
        setattr(db_client, key, value)
        
    session.add(db_client)
    session.commit()
    session.refresh(db_client)
    return db_client
