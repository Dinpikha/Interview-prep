import pytest

from backend.resume_analyzer_backend.parser import resume_analyzer_core as core


def test_compute_similarity_uses_embedding_interface(monkeypatch):
    calls = []
    vectors = {
        "resume": [1.0, 0.0],
        "jd": [0.5, 0.5],
    }

    def fake_get_embedding(text):
        calls.append(text)
        return vectors[text]

    monkeypatch.setattr(core, "get_embedding", fake_get_embedding)

    similarity = core.compute_similarity("resume", "jd")

    assert calls == ["resume", "jd"]
    assert round(similarity, 3) == 0.707


def test_compute_similarity_wraps_embedding_failures(monkeypatch):
    monkeypatch.setattr(core, "get_embedding", lambda text: (_ for _ in ()).throw(RuntimeError("model missing")))

    with pytest.raises(core.EmbeddingError):
        core.compute_similarity("resume", "jd")


@pytest.mark.slow
def test_real_embedding_similarity_orders_related_texts():
    pytest.skip("Model-dependent integration test; keep out of normal CI to avoid downloading all-MiniLM-L6-v2.")
