from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import Create_db_and_tables
import auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    Create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

# Allow CORS for frontend
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:4173", # Vite preview
    "http://localhost:3000",
    "https://suluk.santrafysh.pro",
    "https://www.suluk.santrafysh.pro",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
from routers import clients, items, purchases
app.include_router(clients.router)
app.include_router(items.router)
app.include_router(purchases.router)
from routers import analysis
app.include_router(analysis.router)

@app.get("/")
def read_root():
    return {"message": "Suluk Platform Backend is running"}
