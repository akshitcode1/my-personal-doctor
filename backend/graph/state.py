import operator
from typing import Annotated, Optional, TypedDict, Callable


class SpecialistResponse(TypedDict):
    specialist: str
    display_name: str
    response: str
    rag_sources: list[str]


class AgentState(TypedDict):
    # Input
    user_message: str
    chat_id: str
    user_id: str

    # Conversation memory (sliding window, last 10 messages)
    message_history: list[dict]

    # OCR text from uploaded PDFs injected for this session
    document_context: Optional[str]

    # User's personal medical context from their profile (e.g. chronic conditions, allergies)
    global_context: Optional[str]

    # Triage output
    selected_specialists: list[str]
    triage_reasoning: str

    # Specialist outputs — operator.add accumulates from parallel nodes
    specialist_responses: Annotated[list[SpecialistResponse], operator.add]

    # Final synthesized answer
    final_response: str

    # Clarification gate — set by clarification_node
    needs_clarification: bool
    clarification_questions: list[str]

    # Response mode: 'multi_agent' (default), 'generic' (GP only), or 'manual' (user-chosen specialist)
    mode: Optional[str]

    # Specialist keys chosen by user when mode == 'manual' (supports multiple)
    manual_specialists: Optional[list[str]]

    # WebSocket stream callback — injected before graph.ainvoke()
    stream_callback: Optional[Callable]
