from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import auth, chats, documents, health, messages
from backend.api.websocket import websocket_endpoint
from backend.config.settings import settings

app = FastAPI(
    title="My Personal Doctor API",
    version="1.0.0",
    description="Multi-agent AI healthcare consultation system",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(chats.router, prefix="/api", tags=["chats"])
app.include_router(messages.router, prefix="/api", tags=["messages"])
app.include_router(documents.router, prefix="/api", tags=["documents"])

app.add_api_websocket_route("/ws/{chat_id}", websocket_endpoint)
