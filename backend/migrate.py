#!/usr/bin/env python3
"""
Migration runner for HandSpeak.

Usage:
    python migrate.py              # run all pending migrations
    python migrate.py --list       # list available migrations
    python migrate.py --run 005    # run a specific migration by number prefix
"""

import os
import sys
import glob
import argparse
from pathlib import Path

from env_bootstrap import load_backend_env
load_backend_env()

import psycopg
from psycopg.rows import dict_row

MIGRATIONS_DIR = Path(__file__).parent / "migrations"
DB_URL = os.getenv("DB_URL", "")


def get_connection():
    if not DB_URL:
        print("ERROR: DB_URL is not set in .env")
        sys.exit(1)
    return psycopg.connect(DB_URL, row_factory=dict_row, sslmode="require")


def ensure_migrations_table(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id          BIGSERIAL PRIMARY KEY,
            filename    TEXT NOT NULL UNIQUE,
            applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    conn.commit()


def get_applied(conn):
    rows = conn.execute("SELECT filename FROM schema_migrations ORDER BY filename").fetchall()
    return {r["filename"] for r in rows}


def get_all_migrations():
    files = sorted(glob.glob(str(MIGRATIONS_DIR / "*.sql")))
    return [f for f in files if Path(f).name != "all_schema.sql"]


def run_migration(conn, filepath):
    name = Path(filepath).name
    sql = Path(filepath).read_text(encoding="utf-8")
    conn.execute(sql)
    conn.execute("INSERT INTO schema_migrations (filename) VALUES (%s)", (name,))
    conn.commit()
    print(f"  v  {name}")


def cmd_list(args):
    all_files = get_all_migrations()
    with get_connection() as conn:
        ensure_migrations_table(conn)
        applied = get_applied(conn)
    print(f"\nMigrations in {MIGRATIONS_DIR}:\n")
    for f in all_files:
        name = Path(f).name
        status = "v applied" if name in applied else "  pending"
        print(f"  [{status}]  {name}")
    print()


def cmd_run_all(args):
    all_files = get_all_migrations()
    with get_connection() as conn:
        ensure_migrations_table(conn)
        applied = get_applied(conn)
    pending = [f for f in all_files if Path(f).name not in applied]

    if not pending:
        print("\nAll migrations are already applied. Nothing to do.\n")
        return

    print(f"\nApplying {len(pending)} pending migration(s):\n")
    with get_connection() as conn:
        ensure_migrations_table(conn)
        for f in pending:
            run_migration(conn, f)
    print(f"\nDone.\n")


def cmd_run_specific(args):
    target = args.run
    all_files = get_all_migrations()
    matches = [f for f in all_files if Path(f).name.startswith(target)]
    if not matches:
        print(f"\nERROR: No migration file matching '{target}' found.\n")
        sys.exit(1)
    if len(matches) > 1:
        print(f"\nERROR: Multiple migrations match '{target}': {[Path(f).name for f in matches]}\n")
        sys.exit(1)

    filepath = matches[0]
    name = Path(filepath).name
    with get_connection() as conn:
        ensure_migrations_table(conn)
        applied = get_applied(conn)
        if name in applied:
            print(f"\n  Already applied: {name}\n")
            return
        print(f"\nRunning {name}...\n")
        run_migration(conn, filepath)
    print(f"\nDone.\n")


def main():
    parser = argparse.ArgumentParser(description="HandSpeak migration runner")
    parser.add_argument("--list", action="store_true", help="List migrations and their status")
    parser.add_argument("--run", metavar="PREFIX", help="Run a specific migration by prefix (e.g. 005)")
    args = parser.parse_args()

    if args.list:
        cmd_list(args)
    elif args.run:
        cmd_run_specific(args)
    else:
        cmd_run_all(args)


if __name__ == "__main__":
    main()
