from __future__ import annotations
"""Database persistence layer for HandSpeak backend.

This module centralizes Supabase Postgres reads/writes used by auth, study,
and gesture-verification logging routes.
"""

from functools import lru_cache
from threading import Lock
from typing import Any
import os

import bcrypt
from psycopg import connect
from psycopg.errors import UniqueViolation
from psycopg.rows import dict_row
from psycopg.types.json import Json

from logging_config import get_logger


logger = get_logger("handspeak.services.supabase_store")
MAX_BCRYPT_PASSWORD_BYTES = 72


def _validate_password_length(password: str) -> None:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > MAX_BCRYPT_PASSWORD_BYTES:
        raise ValueError(
            f"Password must be at most {MAX_BCRYPT_PASSWORD_BYTES} bytes in UTF-8."
        )


def _hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


class SupabaseStore:
    """Small repository wrapper around psycopg for app persistence."""

    def __init__(self, db_url: str) -> None:
        self.db_url = db_url.strip()
        self._schema_ready = False
        self._schema_lock = Lock()

    def _connect(self):
        if not self.db_url:
            raise RuntimeError("DB_URL is not configured")

        connect_timeout = int(os.getenv("DB_CONNECT_TIMEOUT", "10"))
        sslmode = os.getenv("DB_SSLMODE", "require")

        return connect(
            self.db_url,
            row_factory=dict_row,
            connect_timeout=connect_timeout,
            sslmode=sslmode,
        )

    def ensure_schema(self) -> None:
        """Create required tables when they do not exist."""
        if self._schema_ready:
            return

        with self._schema_lock:
            if self._schema_ready:
                return

            schema_sql = """
            CREATE TABLE IF NOT EXISTS app_users (
                id BIGSERIAL PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                first_name TEXT,
                middle_name TEXT,
                last_name TEXT,
                nickname TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS study_progress (
                user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
                progress JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS gesture_verifications (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
                target_word TEXT,
                model_type TEXT NOT NULL,
                threshold NUMERIC(5, 3),
                is_match BOOLEAN NOT NULL,
                similarity NUMERIC(8, 6),
                target_similarity NUMERIC(8, 6),
                top_matches JSONB NOT NULL DEFAULT '[]'::jsonb,
                frames JSONB NOT NULL DEFAULT '[]'::jsonb,
                image_data TEXT,
                request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
                response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """

            with self._connect() as connection:
                with connection.cursor() as cursor:
                    cursor.execute(schema_sql)
                connection.commit()

            self._schema_ready = True
            logger.info("database_schema_ready")

    def _fetchone(self, query: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
        self.ensure_schema()
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                row = cursor.fetchone()
                connection.commit()
                return row

    def _execute(self, query: str, params: tuple[Any, ...] = ()) -> None:
        self.ensure_schema()
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                connection.commit()

    @staticmethod
    def _format_user(row: dict[str, Any] | None) -> dict[str, Any] | None:
        if not row:
            return None

        profile_complete = all([row.get("first_name"), row.get("last_name"), row.get("nickname")])
        return {
            "id": int(row["id"]),
            "email": row["email"],
            "first_name": row.get("first_name"),
            "middle_name": row.get("middle_name"),
            "last_name": row.get("last_name"),
            "nickname": row.get("nickname"),
            "profile_complete": profile_complete,
        }

    def create_user(self, email: str, password: str) -> dict[str, Any]:
        _validate_password_length(password)
        password_hash = _hash_password(password)
        query = """
            INSERT INTO app_users (email, password_hash)
            VALUES (%s, %s)
            RETURNING id, email, first_name, middle_name, last_name, nickname
        """

        try:
            row = self._fetchone(query, (email.strip().lower(), password_hash))
        except UniqueViolation as error:
            raise ValueError("Email already registered") from error

        return self._format_user(row)  # type: ignore[return-value]

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        query = """
            SELECT id, email, first_name, middle_name, last_name, nickname, password_hash
            FROM app_users
            WHERE email = %s
        """
        return self._fetchone(query, (email.strip().lower(),))

    def get_user_by_id(self, user_id: int) -> dict[str, Any] | None:
        query = """
            SELECT id, email, first_name, middle_name, last_name, nickname, password_hash
            FROM app_users
            WHERE id = %s
        """
        return self._fetchone(query, (user_id,))

    def verify_credentials(self, email: str, password: str) -> dict[str, Any] | None:
        row = self.get_user_by_email(email)
        if not row:
            return None

        if not _verify_password(password, row["password_hash"]):
            return None

        return self._format_user(row)

    def update_profile(self, user_id: int, profile: dict[str, Any]) -> dict[str, Any]:
        query = """
            UPDATE app_users
            SET first_name = %s,
                middle_name = %s,
                last_name = %s,
                nickname = %s,
                updated_at = NOW()
            WHERE id = %s
            RETURNING id, email, first_name, middle_name, last_name, nickname
        """
        row = self._fetchone(
            query,
            (
                profile.get("first_name"),
                profile.get("middle_name") or "",
                profile.get("last_name"),
                profile.get("nickname"),
                user_id,
            ),
        )
        if not row:
            raise LookupError("User not found")

        return self._format_user(row)  # type: ignore[return-value]

    def get_or_create_progress(self, user_id: int) -> dict[str, Any]:
        row = self._fetchone(
            "SELECT progress FROM study_progress WHERE user_id = %s",
            (user_id,),
        )
        if row:
            return row["progress"] or {}

        empty_progress: dict[str, Any] = {}
        self.save_progress(user_id, empty_progress)
        return empty_progress

    def save_progress(self, user_id: int, progress: dict[str, Any]) -> dict[str, Any]:
        query = """
            INSERT INTO study_progress (user_id, progress, updated_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET progress = EXCLUDED.progress,
                          updated_at = NOW()
            RETURNING progress
        """
        row = self._fetchone(query, (user_id, Json(progress)))
        return row["progress"] if row else progress

    def record_gesture_verification(
        self,
        *,
        user_id: int | None,
        target_word: str | None,
        model_type: str,
        threshold: float | None,
        is_match: bool,
        similarity: float | None,
        target_similarity: float | None,
        top_matches: list[dict[str, Any]],
        frames: list[str],
        image_data: str | None,
        request_payload: dict[str, Any],
        response_payload: dict[str, Any],
    ) -> None:
        query = """
            INSERT INTO gesture_verifications (
                user_id,
                target_word,
                model_type,
                threshold,
                is_match,
                similarity,
                target_similarity,
                top_matches,
                frames,
                image_data,
                request_payload,
                response_payload
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        self._execute(
            query,
            (
                user_id,
                target_word,
                model_type,
                threshold,
                is_match,
                similarity,
                target_similarity,
                Json(top_matches),
                Json(frames),
                image_data,
                Json(request_payload),
                Json(response_payload),
            ),
        )


@lru_cache(maxsize=1)
def get_store() -> SupabaseStore:
    """Return a process-level singleton store instance."""
    return SupabaseStore(os.getenv("DB_URL", ""))
