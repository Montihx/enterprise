"""Security and JWT unit tests — no database required."""
import pytest
from datetime import timedelta
from app.core import security


def test_password_hash_and_verify():
    password = "myStrongPassword!42"
    hashed = security.get_password_hash(password)
    assert hashed != password
    assert security.verify_password(password, hashed)


def test_wrong_password_fails():
    hashed = security.get_password_hash("correct_password")
    assert not security.verify_password("wrong_password", hashed)


def test_create_access_token():
    token = security.create_access_token(data={"sub": "user-id-123"})
    assert isinstance(token, str)
    assert len(token) > 20


def test_create_token_with_expiry():
    token = security.create_access_token(
        data={"sub": "user-123"},
        expires_delta=timedelta(minutes=5)
    )
    assert token is not None


def test_token_decode():
    from jose import jwt
    from app.core.config import settings
    token = security.create_access_token(data={"sub": "test-user", "type": "access"})
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
    assert payload["sub"] == "test-user"
    assert payload["type"] == "access"


def test_refresh_and_access_tokens_differ():
    access = security.create_access_token(data={"sub": "u1", "type": "access"})
    refresh = security.create_refresh_token(data={"sub": "u1", "type": "refresh"})
    assert access != refresh


def test_generate_and_verify_reset_token():
    from app.core.security import generate_reset_token, verify_reset_token
    user_id = "abc123"
    secret = "hashed_password_value"
    token = generate_reset_token(user_id, secret)
    assert verify_reset_token(token, user_id, secret)


def test_reset_token_wrong_secret():
    from app.core.security import generate_reset_token, verify_reset_token
    token = generate_reset_token("user1", "correct_hash")
    assert not verify_reset_token(token, "user1", "wrong_hash")


def test_reset_token_wrong_user():
    from app.core.security import generate_reset_token, verify_reset_token
    token = generate_reset_token("user1", "some_hash")
    assert not verify_reset_token(token, "user2", "some_hash")
