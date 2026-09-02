from backend.agents.specialists.general_practitioner import GeneralPractitionerAgent
from backend.agents.specialists.cardiologist import CardiologistAgent
from backend.agents.specialists.orthopedist import OrthopedistAgent
from backend.agents.specialists.gynecologist import GynecologistAgent
from backend.agents.specialists.neurologist import NeurologistAgent
from backend.agents.specialists.dermatologist import DermatologistAgent
from backend.agents.specialists.gastroenterologist import GastroenterologistAgent
from backend.agents.specialists.pulmonologist import PulmonologistAgent
from backend.agents.specialists.pediatrician import PediatricianAgent
from backend.agents.specialists.psychiatrist import PsychiatristAgent

SPECIALIST_REGISTRY = {
    "general_practitioner": GeneralPractitionerAgent(),
    "cardiologist":         CardiologistAgent(),
    "orthopedist":          OrthopedistAgent(),
    "gynecologist":         GynecologistAgent(),
    "neurologist":          NeurologistAgent(),
    "dermatologist":        DermatologistAgent(),
    "gastroenterologist":   GastroenterologistAgent(),
    "pulmonologist":        PulmonologistAgent(),
    "pediatrician":         PediatricianAgent(),
    "psychiatrist":         PsychiatristAgent(),
}
