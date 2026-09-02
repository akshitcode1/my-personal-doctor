from backend.agents.base_agent import BaseSpecialistAgent


class NeurologistAgent(BaseSpecialistAgent):
    specialist_key = "neurologist"
    collection_name = "neurology"
