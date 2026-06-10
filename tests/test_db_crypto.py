from types import SimpleNamespace

from core.config import settings
from core.db_crypto import DB_ENCRYPTION_PREFIX, decrypt_db_value, encrypt_db_value
from schemas.task_schema import task_to_response


def test_encrypt_db_value_roundtrip(monkeypatch):
    monkeypatch.setattr(settings, "DB_ENCRYPTION_KEY", "00" * 32)

    encrypted = encrypt_db_value("2+2")

    assert encrypted is not None
    assert encrypted.startswith(DB_ENCRYPTION_PREFIX)
    assert encrypted != "2+2"
    assert decrypt_db_value(encrypted) == "2+2"


def test_encrypt_db_value_does_not_encrypt_twice(monkeypatch):
    monkeypatch.setattr(settings, "DB_ENCRYPTION_KEY", "00" * 32)

    encrypted = encrypt_db_value("2+2")

    assert encrypt_db_value(encrypted) == encrypted


def test_decrypt_db_value_keeps_legacy_plaintext():
    assert decrypt_db_value("legacy payload") == "legacy payload"


def test_encrypt_db_value_respects_encrypt_db_toggle(monkeypatch):
    monkeypatch.setattr(settings, "DB_ENCRYPTION_KEY", "00" * 32)
    encrypted = encrypt_db_value("2+2")

    monkeypatch.setattr(settings, "ENCRYPT_DB", False)

    assert encrypt_db_value("3+3") == "3+3"
    assert decrypt_db_value(encrypted) == "2+2"


def test_task_to_response_decrypts_task_fields(monkeypatch):
    monkeypatch.setattr(settings, "DB_ENCRYPTION_KEY", "00" * 32)
    task = SimpleNamespace(
        id=1,
        user_id=2,
        status="completed",
        payload=encrypt_db_value("2+2"),
        result=encrypt_db_value("4.0"),
    )

    response = task_to_response(task)

    assert response.payload == "2+2"
    assert response.result == "4.0"
