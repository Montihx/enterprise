"""
Email service: verification, password reset, notifications.
Uses SMTP via Python stdlib (no extra deps) or SendGrid if configured.
"""
import secrets
import smtplib
import hashlib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.core.config import settings
from app.core.logging import logger


def _make_token(user_id: str, salt: str) -> str:
    raw = f"{user_id}:{salt}:{settings.SECRET_KEY}"
    return hashlib.sha256(raw.encode()).hexdigest()


def generate_verification_token(user_id: str, email: str) -> str:
    salt = secrets.token_hex(16)
    token = _make_token(str(user_id), salt + email)
    return f"{salt}.{token}"


def generate_reset_token(user_id: str, hashed_password: str) -> str:
    """Single-use: invalidated automatically when password changes."""
    salt = secrets.token_hex(16)
    token = _make_token(str(user_id), salt + hashed_password)
    return f"{salt}.{token}"


def verify_reset_token(token: str, user_id: str, hashed_password: str) -> bool:
    try:
        salt, provided = token.split(".", 1)
        expected = _make_token(str(user_id), salt + hashed_password)
        return secrets.compare_digest(provided, expected)
    except Exception:
        return False


def verify_verification_token(token: str, user_id: str, email: str) -> bool:
    try:
        salt, provided = token.split(".", 1)
        expected = _make_token(str(user_id), salt + email)
        return secrets.compare_digest(provided, expected)
    except Exception:
        return False


def _send_smtp(to_email: str, subject: str, html_body: str) -> bool:
    smtp_host = getattr(settings, "SMTP_HOST", None)
    smtp_port = getattr(settings, "SMTP_PORT", 587)
    smtp_user = getattr(settings, "SMTP_USER", None)
    smtp_pass = getattr(settings, "SMTP_PASSWORD", None)
    from_email = getattr(settings, "EMAILS_FROM_EMAIL", "noreply@kitsu.io")

    if not smtp_host or not smtp_user:
        # Dev mode: just log
        logger.info("Email (dev/no-SMTP)", to=to_email, subject=subject)
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, to_email, msg.as_string())
        return True
    except Exception as e:
        logger.error("Email send failed", error=str(e))
        return False


class EmailService:
    def send_verification(self, to_email: str, username: str, token: str, user_id: str) -> bool:
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        url = f"{frontend_url}/verify-email?token={token}&uid={user_id}"
        html = f"""<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2>Добро пожаловать в Kitsu, {username}!</h2>
            <p>Подтвердите ваш email-адрес:</p>
            <a href="{url}" style="display:inline-block;padding:12px 24px;background:#6366f1;
               color:white;border-radius:6px;text-decoration:none;font-weight:bold">
               Подтвердить email</a>
            <p style="color:#888;margin-top:24px">Ссылка действительна 24 часа.</p>
        </div>"""
        return _send_smtp(to_email, "Подтвердите ваш email — Kitsu", html)

    def send_password_reset(self, to_email: str, username: str, token: str, user_id: str) -> bool:
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        url = f"{frontend_url}/reset-password?token={token}&uid={user_id}"
        html = f"""<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2>Сброс пароля — Kitsu</h2>
            <p>Привет, {username}! Получен запрос на сброс пароля.</p>
            <a href="{url}" style="display:inline-block;padding:12px 24px;background:#ef4444;
               color:white;border-radius:6px;text-decoration:none;font-weight:bold">
               Сбросить пароль</a>
            <p style="color:#888;margin-top:24px">
               Ссылка действительна 1 час. Если вы не запрашивали — смените пароль немедленно.
            </p>
        </div>"""
        return _send_smtp(to_email, "Сброс пароля — Kitsu", html)

    def send_new_episode_notification(self, to_email: str, username: str, anime_title: str, episode_num: int, anime_slug: str) -> bool:
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        url = f"{frontend_url}/anime/{anime_slug}/watch?episode={episode_num}"
        html = f"""<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2>Новый эпизод — {anime_title}</h2>
            <p>Привет, {username}! Вышел эпизод #{episode_num}.</p>
            <a href="{url}" style="display:inline-block;padding:12px 24px;background:#10b981;
               color:white;border-radius:6px;text-decoration:none;font-weight:bold">
               Смотреть сейчас</a>
        </div>"""
        return _send_smtp(to_email, f"Новый эпизод — {anime_title} — Kitsu", html)


email_service = EmailService()
