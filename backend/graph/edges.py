from langgraph.constants import Send
from langgraph.graph import END
from backend.graph.state import AgentState
from backend.config.constants import SPECIALIST_COLLECTIONS


def route_to_specialists(state: AgentState) -> list[Send]:
    """Parallel fan-out to selected specialists."""
    return [
        Send(f"specialist_{key}", state)
        for key in state["selected_specialists"]
        if key in SPECIALIST_COLLECTIONS
    ]


def clarification_gate(state: AgentState) -> str:
    """
    String-only routing after clarification_node.
    Returns 'done' (→ END) or 'dispatch' (→ dispatch node that fans out).
    Keeps return type as plain string so LangGraph's edge resolution is unambiguous.
    """
    return "done" if state.get("needs_clarification") else "dispatch"
