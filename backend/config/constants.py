TRIAGE_MODEL = "claude-haiku-4-5"
SPECIALIST_MODEL = "claude-haiku-4-5"
SYNTHESIS_MODEL = "claude-sonnet-4-6"

TRIAGE_MAX_TOKENS = 200
SPECIALIST_MAX_TOKENS = 800
SYNTHESIS_MAX_TOKENS = 1200

RAG_TOP_K = 3
RAG_CHUNK_SIZE_CHARS = 2000
RAG_CHUNK_OVERLAP_CHARS = 200

MAX_HISTORY_MESSAGES = 10
MAX_DOCUMENT_CONTEXT_CHARS = 4000
PDF_MAX_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB

SPECIALIST_COLLECTIONS: dict[str, str] = {
    "general_practitioner": "gp_general",
    "cardiologist":         "cardiology",
    "orthopedist":          "orthopedics",
    "gynecologist":         "gynecology",
    "neurologist":          "neurology",
    "dermatologist":        "dermatology",
    "gastroenterologist":   "gastroenterology",
    "pulmonologist":        "pulmonology",
    "pediatrician":         "pediatrics",
    "psychiatrist":         "psychiatry",
    "dentist":              "dentistry",
}

SPECIALIST_DISPLAY_NAMES: dict[str, str] = {
    "general_practitioner": "General Practitioner",
    "cardiologist":         "Cardiologist",
    "orthopedist":          "Orthopedist",
    "gynecologist":         "Gynecologist",
    "neurologist":          "Neurologist",
    "dermatologist":        "Dermatologist",
    "gastroenterologist":   "Gastroenterologist",
    "pulmonologist":        "Pulmonologist",
    "pediatrician":         "Pediatrician",
    "psychiatrist":         "Psychiatrist",
    "dentist":              "Dentist",
}
