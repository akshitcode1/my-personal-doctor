import json
from datetime import datetime, timezone

from fastapi import WebSocket, WebSocketDisconnect

from backend.api.dependencies import verify_ws_token
from backend.graph.builder import COMPILED_GRAPH
from backend.graph.nodes import generate_chat_title
from backend.services.chat_service import get_chat, update_chat_title
from backend.services.document_service import get_document_context
from backend.services.message_service import get_messages, save_message
from backend.utils.history import get_sliding_window


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, WebSocket] = {}

    async def connect(self, chat_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[chat_id] = websocket

    def disconnect(self, chat_id: str, websocket: WebSocket) -> None:
        # Only remove if this is still the active WS for this chat.
        # Guards against a race where an old connection's close event fires
        # after a new connection has already been registered.
        if self._connections.get(chat_id) is websocket:
            self._connections.pop(chat_id, None)

    async def emit(self, chat_id: str, event: dict) -> None:
        ws = self._connections.get(chat_id)
        if ws:
            try:
                await ws.send_text(json.dumps(event))
            except Exception:
                pass


manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, chat_id: str) -> None:
    """
    WS /ws/{chat_id}

    Client → server message format:
        {"type": "message", "content": "...", "token": "<supabase JWT>"}

    JWT is sent in message payload because browser WebSocket API cannot
    send custom headers during handshake.
    """
    await manager.connect(chat_id, websocket)
    user_id: str | None = None

    try:
        while True:
            raw = await websocket.receive_text()
            payload = json.loads(raw)

            if payload.get("type") != "message":
                continue

            # Authenticate on every message
            token = payload.get("token", "")
            user_id = await verify_ws_token(token)
            if not user_id:
                await manager.emit(chat_id, {
                    "type": "error",
                    "message": "Unauthorized",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                break

            # Verify the chat belongs to this user
            chat = await get_chat(chat_id, user_id)
            if not chat:
                await manager.emit(chat_id, {
                    "type": "error",
                    "message": "Chat not found",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                break

            user_message: str = payload.get("content", "").strip()
            if not user_message:
                continue

            global_context: str | None = payload.get("global_context") or None
            mode: str = payload.get("mode", "multi_agent")
            manual_specialists: list[str] | None = payload.get("manual_specialists") or None

            # Fetch history BEFORE saving user message so it stays out of the
            # sliding window (each node appends user_message itself as the final turn)
            raw_history = await get_messages(chat_id)
            is_first_message = len(raw_history) == 0
            history = get_sliding_window(raw_history)
            doc_ctx = await get_document_context(chat_id)

            # Persist user message (after history fetch so it isn't duplicated)
            await save_message(chat_id, user_id, "user", user_message)

            # Streaming callback — sends every agent event over the WebSocket
            async def emit_event(event: dict) -> None:
                await manager.emit(chat_id, event)

            initial_state = {
                "user_message": user_message,
                "chat_id": chat_id,
                "user_id": user_id,
                "message_history": history,
                "document_context": doc_ctx,
                "global_context": global_context,
                "mode": mode,
                "manual_specialists": manual_specialists,
                "selected_specialists": [],
                "triage_reasoning": "",
                "specialist_responses": [],
                "final_response": "",
                "needs_clarification": False,
                "clarification_questions": [],
                "stream_callback": emit_event,
            }

            result = await COMPILED_GRAPH.ainvoke(initial_state)

            # Auto-rename chat on first message
            if is_first_message:
                title = await generate_chat_title(user_message)
                await update_chat_title(chat_id, user_id, title)
                await manager.emit(chat_id, {
                    "type": "chat_renamed",
                    "chat_id": chat_id,
                    "title": title,
                    "timestamp": _ts(),
                })

            if result.get("needs_clarification"):
                # Persist clarification questions as assistant message
                questions = result.get("clarification_questions", [])
                questions_text = (
                    "To give you the best advice, I have a few quick questions:\n\n"
                    + "\n".join(f"• {q}" for q in questions)
                )
                await save_message(
                    chat_id=chat_id,
                    user_id=user_id,
                    role="assistant",
                    content=questions_text,
                )
            else:
                # Persist assistant message with specialist metadata
                await save_message(
                    chat_id=chat_id,
                    user_id=user_id,
                    role="assistant",
                    content=result["final_response"],
                    selected_specialists=result.get("selected_specialists"),
                    specialist_responses=result.get("specialist_responses"),
                )

    except WebSocketDisconnect:
        manager.disconnect(chat_id, websocket)
    except Exception as e:
        await manager.emit(chat_id, {
            "type": "error",
            "message": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        manager.disconnect(chat_id, websocket)
