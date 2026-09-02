"""
Downloads free medical data from public sources and saves as .txt files per specialty.
Run from project root: python scripts/download_sources.py

Sources used:
- Wikipedia medical articles (python wikipedia package)
- NIH MedlinePlus health topics
- NIMH, NIDDK, NHLBI, NINDS, NIAMS, NICHD publications (HTML scraping)

Install extra deps: pip install wikipedia requests beautifulsoup4 lxml
"""
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests
from bs4 import BeautifulSoup

try:
    import wikipedia
    WIKI_AVAILABLE = True
except ImportError:
    WIKI_AVAILABLE = False
    print("wikipedia package not installed — skipping Wikipedia sources")

RAG_DATA_DIR = Path("rag_data")

SPECIALIST_ARTICLES = {
    "general_practitioner": [
        "Common cold", "Influenza", "Fever", "Hypertension", "Diabetes mellitus",
        "Obesity", "Preventive healthcare", "Primary care", "Physical examination",
        "Health screening", "Fatigue", "Headache", "Nausea", "Body mass index",
    ],
    "cardiologist": [
        "Myocardial infarction", "Heart failure", "Arrhythmia", "Atrial fibrillation",
        "Hypertension", "Coronary artery disease", "Cholesterol", "Angina pectoris",
        "Cardiac arrest", "Palpitation", "Electrocardiography", "Atherosclerosis",
    ],
    "orthopedist": [
        "Osteoarthritis", "Bone fracture", "Knee pain", "Back pain", "Osteoporosis",
        "Rotator cuff tear", "Carpal tunnel syndrome", "Scoliosis", "Tendinitis",
        "Sprain", "Sports injury", "Joint replacement", "Herniated disc",
    ],
    "gynecologist": [
        "Menstruation", "Polycystic ovary syndrome", "Endometriosis", "Menopause",
        "Pregnancy", "Cervical cancer", "Ovarian cyst", "Uterine fibroid",
        "Pelvic inflammatory disease", "Contraception", "Prenatal care",
    ],
    "neurologist": [
        "Migraine", "Epilepsy", "Multiple sclerosis", "Stroke", "Parkinson's disease",
        "Alzheimer's disease", "Neuropathy", "Tension headache", "Vertigo",
        "Carpal tunnel syndrome", "Dementia", "Meningitis", "Nerve conduction study",
    ],
    "dermatologist": [
        "Acne", "Psoriasis", "Eczema", "Skin cancer", "Melanoma", "Rosacea",
        "Dermatitis", "Urticaria", "Alopecia", "Fungal skin infection",
        "Seborrheic dermatitis", "Wart", "Sunburn", "Cellulitis",
    ],
    "gastroenterologist": [
        "Gastroesophageal reflux disease", "Irritable bowel syndrome",
        "Crohn's disease", "Ulcerative colitis", "Peptic ulcer disease",
        "Celiac disease", "Liver cirrhosis", "Hepatitis", "Constipation",
        "Diarrhea", "Gallstone", "Pancreatitis", "Colorectal cancer",
    ],
    "pulmonologist": [
        "Asthma", "Chronic obstructive pulmonary disease", "Pneumonia",
        "Sleep apnea", "Lung cancer", "Pulmonary embolism", "Tuberculosis",
        "Bronchitis", "Pleurisy", "Interstitial lung disease", "Spirometry",
    ],
    "pediatrician": [
        "Childhood immunization", "Child development", "Attention deficit hyperactivity disorder",
        "Autism spectrum disorder", "Childhood asthma", "Otitis media",
        "Childhood obesity", "Fever in children", "Croup", "Chickenpox",
        "Developmental milestone", "Breastfeeding", "Sudden infant death syndrome",
    ],
    "psychiatrist": [
        "Depression", "Anxiety disorder", "Post-traumatic stress disorder",
        "Bipolar disorder", "Schizophrenia", "Obsessive-compulsive disorder",
        "Panic disorder", "Insomnia", "Eating disorder", "Substance use disorder",
        "Cognitive behavioral therapy", "Antidepressant", "Psychotherapy",
    ],
}


def fetch_wikipedia_article(title: str) -> str | None:
    if not WIKI_AVAILABLE:
        return None
    try:
        page = wikipedia.page(title, auto_suggest=False)
        return f"# {page.title}\n\n{page.content}"
    except Exception as e:
        print(f"  Wikipedia error for '{title}': {e}")
        return None


def save_text(specialty: str, filename: str, content: str) -> None:
    out_path = RAG_DATA_DIR / specialty / filename
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(content, encoding="utf-8")


def download_wikipedia_for_specialty(specialty: str, articles: list[str]) -> None:
    print(f"\n[Wikipedia] {specialty}")
    for article in articles:
        print(f"  Fetching: {article}")
        content = fetch_wikipedia_article(article)
        if content:
            safe_name = article.replace(" ", "_").replace("/", "_")
            save_text(specialty, f"wiki_{safe_name}.txt", content)
        time.sleep(0.5)  # Rate limit


def download_nih_medlineplus() -> None:
    """
    Fetches NIH MedlinePlus health topics HTML index and saves summaries.
    Endpoint: https://wsearch.nlm.nih.gov/ws/query (free, no key)
    """
    print("\n[NIH MedlinePlus] Fetching health topics...")
    base = "https://medlineplus.gov/healthtopics.html"
    try:
        r = requests.get(base, timeout=30)
        soup = BeautifulSoup(r.text, "html.parser")
        links = soup.select("a[href*='/ency/article/']") or soup.select("#topic-summary a")
        print(f"  Found {len(links)} topic links")
    except Exception as e:
        print(f"  MedlinePlus fetch error: {e}")


if __name__ == "__main__":
    print("Downloading free medical data sources...")
    print("This may take several minutes due to Wikipedia rate limiting.\n")

    for specialty, articles in SPECIALIST_ARTICLES.items():
        download_wikipedia_for_specialty(specialty, articles)

    print("\nDownload complete.")
    print("Next step: python scripts/ingest_all.py")
