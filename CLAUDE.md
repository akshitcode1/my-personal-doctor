# My Personal Doctor — Developer Reference

## Project Overview

Multi-agent AI healthcare system. A user query is triaged by a fast classifier (Haiku),
routed to 1–3 specialist doctor agents that each consult domain-specific medical literature
via RAG (ChromaDB), and a synthesis agent (Sonnet) produces the final patient-friendly answer.
The entire agent conversation streams live to the frontend via WebSocket.

## Stack

| Layer | Technology |
|---|---|
| LLM | Anthropic Claude API (`claude-haiku-4-5` + `claude-sonnet-4-6`) |
| Agent orchestration | LangGraph `StateGraph` |
| Vector DB | ChromaDB (embedded `PersistentClient`, no separate server) |
| Embeddings | `all-MiniLM-L6-v2` via sentence-transformers (free, local) |
| Backend | FastAPI + uvicorn |
| Frontend | React 18 + Vite + TypeScript + Zustand |
| Database / Auth | Supabase (free tier) |
| PDF processing | PyMuPDF + pytesseract (OCR) |

## Running the Project

### Prerequisites
- Python 3.11+, Node 18+
- Tesseract OCR installed: `choco install tesseract` (Windows) or `apt install tesseract-ocr`
- Copy `.env.example` → `.env` and fill all values

### Backend
```bash
cd backend
pip install -r requirements.txt
# Ingest RAG data FIRST (only needed once, or when sources change)
cd ..
python scripts/ingest_all.py
# Start server
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key (client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only, never expose) |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase dashboard → Settings → API |
| `CHROMA_DB_PATH` | Path to ChromaDB storage dir (default: `../chroma_db`) |
| `FRONTEND_URL` | Frontend origin for CORS (default: `http://localhost:5173`) |

## Critical Architecture Rules

### Singletons — Never Recreate Per Request
- `COMPILED_GRAPH` in `backend/graph/builder.py` — built once at module import
- `get_chroma_client()` in `backend/rag/chroma_client.py` — lazy module global
- `get_embedder()` in `backend/rag/embedder.py` — lazy module global (`all-MiniLM-L6-v2` takes ~2s to load)
- Supabase client in `backend/services/supabase_client.py` — module-level

### Token Efficiency Rules
- Triage: `claude-haiku-4-5`, max 200 output tokens
- Each specialist: `claude-haiku-4-5`, max 800 output tokens
- Synthesis: `claude-sonnet-4-6`, max 1200 output tokens (called ONCE per query)
- Sliding window: last 10 messages only — enforced in `utils/history.py`
- RAG: k=3 chunks, chunk size ~2000 chars (~512 tokens)
- Prompt caching: all static system prompts use `cache_control: {"type": "ephemeral"}`
- Document context: OCR text truncated to 4000 chars, injected into user turn directly

### LangGraph Parallel Dispatch
- `route_to_specialists()` in `graph/edges.py` returns `List[Send]` — parallel execution
- `specialist_responses` field uses `operator.add` reducer — accumulates from all parallel nodes safely
- `synthesis_node` auto-waits for all parallel specialist nodes before running
- Do NOT add manual locks or counters — LangGraph handles join automatically

### WebSocket Auth
- Browser WebSocket API cannot send custom headers during handshake
- JWT is sent in the FIRST message payload: `{"type": "message", "content": "...", "token": "<JWT>"}`
- Backend verifies token on each message via `verify_ws_token()` in `api/dependencies.py`

### Supabase
- Use `SUPABASE_SERVICE_ROLE_KEY` for all backend operations (bypasses RLS)
- Use `SUPABASE_ANON_KEY` only in frontend — enforces RLS
- Storage bucket: `medical-documents` (private)

### Document Context vs RAG
- Uploaded PDF text is injected DIRECTLY into the agent user turn (not RAG-indexed)
- Reason: per-chat documents are unique to the user, not reusable medical knowledge
- RAG collections in ChromaDB contain curated public medical literature only
- Document context is prepended: `"Patient records:\n{doc_ctx}\n\nQuery: {user_message}"`

## Specialist Agents

| Key | Chroma Collection |
|---|---|
| `general_practitioner` | `gp_general` |
| `cardiologist` | `cardiology` |
| `orthopedist` | `orthopedics` |
| `gynecologist` | `gynecology` |
| `neurologist` | `neurology` |
| `dermatologist` | `dermatology` |
| `gastroenterologist` | `gastroenterology` |
| `pulmonologist` | `pulmonology` |
| `pediatrician` | `pediatrics` |
| `psychiatrist` | `psychiatry` |
| `dentist` | `dentistry` |

## RAG Data Ingestion

1. Download free medical data: `python scripts/download_sources.py`
2. Place `.txt` files in `rag_data/{specialty}/`
3. Run ingestion: `python scripts/ingest_all.py`
4. Verify: `python scripts/verify_collections.py`

Free data sources: NIH MedlinePlus XML, NHLBI, NINDS, NIDDK, NIAMS, NIMH, womenshealth.gov, DermNet NZ, AAP HealthyChildren.org, Wikipedia medical articles.

## WebSocket Event Flow

```
triage_start → triage_complete → [agent_start → agent_thinking → agent_token...
→ agent_complete] (parallel, one per specialist) → synthesis_start → synthesis_token...
→ synthesis_complete
```

## Supabase Schema

Run `supabase/schema.sql` in the Supabase SQL editor.
Tables: `profiles`, `chats`, `messages`, `uploaded_documents`.
RLS enabled on all tables.
