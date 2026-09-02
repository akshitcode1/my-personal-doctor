from backend.agents.base_agent import BaseSpecialistAgent


class PediatricianAgent(BaseSpecialistAgent):
    specialist_key = "pediatrician"
    collection_name = "pediatrics"
