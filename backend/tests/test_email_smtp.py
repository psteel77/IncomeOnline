"""Regression tests for the Google Workspace SMTP email engine (email_service._send_email)."""
import os
from unittest.mock import patch, MagicMock

import email_service as es


def _set_env():
    os.environ["SMTP_HOST"] = "smtp.gmail.com"
    os.environ["SMTP_PORT"] = "587"
    os.environ["SMTP_USERNAME"] = "welcome@incomeonline.info"
    os.environ["SMTP_PASSWORD"] = "dummyapppassword"
    os.environ["SMTP_FROM"] = "Income Online <welcome@incomeonline.info>"


def test_send_email_success_uses_starttls_and_login():
    _set_env()
    with patch("email_service.smtplib.SMTP") as mock_smtp:
        server = mock_smtp.return_value.__enter__.return_value
        ok = es._send_email(
            to_email="recipient@example.com",
            subject="Hello",
            html="<p>Hi</p>",
            text="Hi",
        )
    assert ok is True
    mock_smtp.assert_called_with("smtp.gmail.com", 587, timeout=30)
    server.starttls.assert_called_once()
    server.login.assert_called_once_with("welcome@incomeonline.info", "dummyapppassword")
    server.send_message.assert_called_once()


def test_send_email_missing_credentials_returns_false():
    _set_env()
    os.environ.pop("SMTP_PASSWORD", None)
    with patch("email_service.smtplib.SMTP") as mock_smtp:
        ok = es._send_email(
            to_email="recipient@example.com",
            subject="Hello",
            html="<p>Hi</p>",
            text="Hi",
        )
    assert ok is False
    mock_smtp.assert_not_called()


def test_send_email_with_attachment():
    _set_env()
    with patch("email_service.smtplib.SMTP") as mock_smtp:
        server = mock_smtp.return_value.__enter__.return_value
        ok = es._send_email(
            to_email="recipient@example.com",
            subject="Guide",
            html="<p>Attached</p>",
            text="Attached",
            attachments=[{"filename": "guide.docx", "content_bytes": b"abc"}],
        )
    assert ok is True
    server.send_message.assert_called_once()
    sent_msg = server.send_message.call_args[0][0]
    # The message should carry one attachment part named guide.docx
    filenames = [p.get_filename() for p in sent_msg.iter_attachments()]
    assert "guide.docx" in filenames
