from Database import db


def test_question_hash_is_stable_and_normalizes_spacing_and_case():
    first = db._question_hash(" Explain   FastAPI dependency injection ")
    second = db._question_hash("explain fastapi dependency injection")

    assert first == second


def test_question_hash_changes_for_different_questions():
    assert db._question_hash("Explain FastAPI") != db._question_hash("Explain React hooks")
