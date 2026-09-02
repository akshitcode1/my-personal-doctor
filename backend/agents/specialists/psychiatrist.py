from backend.agents.base_agent import BaseSpecialistAgent


class PsychiatristAgent(BaseSpecialistAgent):
    specialist_key = "psychiatrist"
    collection_name = "psychiatry"
