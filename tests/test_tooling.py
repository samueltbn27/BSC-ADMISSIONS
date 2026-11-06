"""Focused runner checks that do not require a database server."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("database", Path(__file__).resolve().parents[1] / "scripts/database.py")
database = importlib.util.module_from_spec(spec)
spec.loader.exec_module(database)


class ToolingTests(unittest.TestCase):
    def test_sql_literal_escaping(self):
        self.assertEqual(database.literal("x'; SELECT 1;--"), "'x''; SELECT 1;--'")

    def test_rollback_requires_explicit_flag(self):
        with self.assertRaisesRegex(RuntimeError, "allow-destructive"):
            database.rollback(False)

    def test_error_does_not_print_database_values(self):
        with patch.object(database.subprocess, "run") as run:
            run.return_value.returncode = 1
            run.return_value.stderr = "password_hash=private-value"
            with self.assertRaises(RuntimeError) as result:
                database.psql("SELECT 1")
            self.assertNotIn("private-value", str(result.exception))


if __name__ == "__main__":
    unittest.main()
