from functools import lru_cache

from core.config import settings
from fastembed import TextEmbedding
from models.course import Course


@lru_cache(maxsize=1)
def get_model() -> TextEmbedding:
    model = TextEmbedding(
        settings.EMBEDDING_MODEL, cache_dir=settings.EMBEDDING_CACHE_DIR
    )
    dimensions = len(next(iter(model.embed(["dimension check"]))))
    if dimensions != settings.EMBEDDING_DIMENSIONS:
        raise RuntimeError(
            f"{settings.EMBEDDING_MODEL} outputs {dimensions} dims, "
            f"but EMBEDDING_DIMENSIONS={settings.EMBEDDING_DIMENSIONS}"
        )
    return model


def embedding_text(course: Course) -> str:
    """Build the text to embed from the fields a course actually has."""
    prerequisites = course.prerequisites
    parts = [
        course.title,
        course.category,
        course.level,
        course.description,
        (
            f"Prerequisites: {', '.join(prerequisites)}"
            if prerequisites
            else None
        ),
    ]
    return ". ".join(str(part).strip() for part in parts if part and str(part).strip())


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    try:
        return _embed_sync(texts)
    except Exception as error:
        raise RuntimeError(f"Embedding failed: {error}") from error


def _embed_sync(texts: list[str]) -> list[list[float]]:
    return [vector.tolist() for vector in get_model().embed(texts, batch_size=64)]


def embedding_fields(course: Course) -> dict[str, list[float] | str]:
    [vector] = embed_texts([embedding_text(course)])
    return {"embedding": vector, "embedding_model": settings.EMBEDDING_MODEL}
