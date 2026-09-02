from backend.agents.base_agent import BaseSpecialistAgent


class CardiologistAgent(BaseSpecialistAgent):
    specialist_key = "cardiologist"
    collection_name = "cardiology"
