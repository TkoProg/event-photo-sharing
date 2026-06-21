from pathlib import Path

from PIL import Image

from app.config import settings

try:
    import torch
    from transformers import CLIPModel, CLIPProcessor
except ImportError:
    torch = None
    CLIPModel = None
    CLIPProcessor = None


class AITaggingService:
    _model = None
    _processor = None
    _device = None
    _IGNORISANI_TAGOVI = {"photo", "image", "picture", "landscape photo"}

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
            return True

        if torch is None or CLIPModel is None or CLIPProcessor is None:
            raise RuntimeError(
                "AI dependencies nisu dostupne. Instalirajte torch i transformers "
                "da bi CLIP tagovanje radilo kao u staroj implementaciji."
            )

        cls._device = "cuda" if torch.cuda.is_available() else "cpu"
        try:
            cls._model = CLIPModel.from_pretrained(
                settings.ai_model_name,
                local_files_only=settings.ai_model_local_files_only,
            )
            cls._processor = CLIPProcessor.from_pretrained(
                settings.ai_model_name,
                local_files_only=settings.ai_model_local_files_only,
            )
        except OSError as exc:
            raise RuntimeError(
                f"AI model nije dostupan ({settings.ai_model_name}). "
                "Provjerite internet konekciju ili lokalni HuggingFace cache."
            ) from exc

        cls._model.eval()
        cls._model.to(cls._device)
        return True

    @classmethod
    def analiziraj_sliku(cls, putanja_slike: str, top_k: int = 5) -> list[dict]:
        slika = Image.open(putanja_slike).convert("RGB")

        cls.inicijalizuj_model()

        return cls._analiziraj_sliku_clip(slika, top_k=top_k)

    @classmethod
    def _analiziraj_sliku_clip(cls, slika: Image.Image, top_k: int = 5) -> list[dict]:
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
        for idx, score in sortirani:
            tag = cls._TAGS[idx]
            if tag in cls._IGNORISANI_TAGOVI:
                continue

            if score >= 0.1:
                rezultati.append({"tag": tag, "pouzdanost": float(score)})

            if len(rezultati) >= top_k:
                break

        return rezultati

    @classmethod
    def analiziraj_batch_slike(cls, putanja_foldera: str, slike: list[str]) -> dict:
        rezultati = {}

        for naziv_slike in slike:
            putanja = Path(putanja_foldera) / naziv_slike
            rezultati[naziv_slike] = cls.analiziraj_sliku(str(putanja)) if putanja.exists() else []

        return rezultati
