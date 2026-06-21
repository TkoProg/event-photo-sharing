from pathlib import Path

import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor


class AITaggingService:
    _model = None
    _processor = None
    _device = None

    _TAGS = [
        "person",
        "face",
        "group of people",
        "child",
        "man",
        "woman",
        "nature",
        "landscape",
        "mountains",
        "sea",
        "forest",
        "river",
        "city",
        "building",
        "street",
        "park",
        "monument",
        "event",
        "party",
        "gathering",
        "ceremony",
        "conversation",
        "food",
        "drink",
        "table",
        "textile",
        "clothes",
        "shoes",
        "jewelry",
        "animal",
        "dog",
        "cat",
        "bird",
        "insect",
        "vehicle",
        "car",
        "bicycle",
        "motorcycle",
        "night",
        "day",
        "sunset",
        "sunrise",
        "rain",
        "snow",
        "clouds",
        "sun",
        "indoors",
        "outdoors",
        "portrait",
        "landscape photo",
        "close-up",
        "panorama",
        "colorful",
        "black and white",
        "sepia",
    ]

    @classmethod
    def inicijalizuj_model(cls):
        if cls._model is not None:
            return

        cls._device = "cuda" if torch.cuda.is_available() else "cpu"
        model_name = "openai/clip-vit-base-patch32"

        cls._model = CLIPModel.from_pretrained(model_name)
        cls._processor = CLIPProcessor.from_pretrained(model_name)
        cls._model.eval()
        cls._model.to(cls._device)

    @classmethod
    def analiziraj_sliku(cls, putanja_slike: str, top_k: int = 5) -> list[dict]:
        cls.inicijalizuj_model()

        slika = Image.open(putanja_slike).convert("RGB")
        inputs = cls._processor(
            text=cls._TAGS,
            images=slika,
            return_tensors="pt",
            padding=True,
        )
        inputs = {k: v.to(cls._device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = cls._model(**inputs)

        probs = outputs.logits_per_image.softmax(dim=1)[0]
        sortirani = sorted(enumerate(probs.cpu().numpy()), key=lambda item: item[1], reverse=True)

        rezultati = []
        for idx, score in sortirani[:top_k]:
            if score >= 0.1:
                rezultati.append({"tag": cls._TAGS[idx], "pouzdanost": float(score)})

        return rezultati

    @classmethod
    def analiziraj_batch_slike(cls, putanja_foldera: str, slike: list[str]) -> dict:
        rezultati = {}

        for naziv_slike in slike:
            putanja = Path(putanja_foldera) / naziv_slike
            rezultati[naziv_slike] = cls.analiziraj_sliku(str(putanja)) if putanja.exists() else []

        return rezultati


