from langgraph.graph import StateGraph, START, END

from backend.config.constants import SPECIALIST_COLLECTIONS
from backend.graph.edges import clarification_gate, route_to_specialists
from backend.graph.nodes import clarification_node, make_specialist_node, synthesis_node, triage_node
from backend.graph.state import AgentState


def build_graph():
    builder = StateGraph(AgentState)

    builder.add_node("triage", triage_node)
    builder.add_node("clarification", clarification_node)
    builder.add_node("synthesis", synthesis_node)

    # Dispatch: a no-op pass-through whose only job is to fan-out to specialists.
    # Keeps the fan-out (List[Send] return) separate from the string-routing gate.
    builder.add_node("dispatch", lambda s: {})

    for key in SPECIALIST_COLLECTIONS:
        builder.add_node(f"specialist_{key}", make_specialist_node(key))

    # Linear: start → triage → clarification
    builder.add_edge(START, "triage")
    builder.add_edge("triage", "clarification")

    # Gate: plain string routing — 'done' ends the graph, 'dispatch' fans out
    builder.add_conditional_edges(
        "clarification",
        clarification_gate,
        {"done": END, "dispatch": "dispatch"},
    )

    # Fan-out: dispatch → specialist_* (parallel via Send)
    builder.add_conditional_edges("dispatch", route_to_specialists)

    # Convergence: all specialists → synthesis → end
    for key in SPECIALIST_COLLECTIONS:
        builder.add_edge(f"specialist_{key}", "synthesis")

    builder.add_edge("synthesis", END)
    return builder.compile()


# Module-level singleton — compiled once at startup, never recreated per request
COMPILED_GRAPH = build_graph()
