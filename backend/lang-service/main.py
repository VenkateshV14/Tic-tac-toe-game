from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load translations from JSON
with open("translations.json", "r", encoding="utf-8") as f:
    translations = json.load(f)

@app.get("/translations")
def get_translations(lang: str = "en"):
    if lang not in translations:
        raise HTTPException(status_code=404, detail="Language not supported")
    return translations[lang]

@app.get("/")
def root():
    return {"message": "i18n Microservice is running. Try /translations?lang=en"}
