from backend.agents.base_agent import BaseSpecialistAgent


class GeneralPractitionerAgent(BaseSpecialistAgent):
    specialist_key = "general_practitioner"
    collection_name = "gp_general"
