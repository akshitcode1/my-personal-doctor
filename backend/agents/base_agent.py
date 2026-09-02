from abc import ABC
from backend.config.constants import SPECIALIST_COLLECTIONS


class BaseSpecialistAgent(ABC):
    specialist_key: str
    collection_name: str

    def validate(self) -> None:
        assert self.specialist_key in SPECIALIST_COLLECTIONS, \
            f"Unknown specialist key: {self.specialist_key}"
