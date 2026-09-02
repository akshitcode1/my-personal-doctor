from backend.config.constants import MAX_HISTORY_MESSAGES


def get_sliding_window(messages: list[dict]) -> list[dict]:
    """
    Returns the last MAX_HISTORY_MESSAGES in Claude API format.
    Ensures first message is from 'user' (Claude API requirement).
    """
    recent = messages[-MAX_HISTORY_MESSAGES:] if len(messages) > MAX_HISTORY_MESSAGES else messages
    formatted = [{"role": m["role"], "content": m["content"]} for m in recent]

    # Claude API requires conversation to start with a user message
    while formatted and formatted[0]["role"] != "user":
        formatted.pop(0)

    return formatted
