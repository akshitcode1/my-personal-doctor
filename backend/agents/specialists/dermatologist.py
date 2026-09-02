from backend.agents.base_agent import BaseSpecialistAgent


class DermatologistAgent(BaseSpecialistAgent):
    specialist_key = "dermatologist"
    collection_name = "dermatology"
