from pathlib import Path

from django.test import SimpleTestCase

from rag_engine.db.vector_store import PROJECT_ROOT, resolve_vector_db_dir


class VectorStorePathTests(SimpleTestCase):
    def test_relative_chroma_path_resolves_from_project_root(self):
        resolved = resolve_vector_db_dir("./data/vector_db")

        self.assertEqual(resolved, (PROJECT_ROOT / "data" / "vector_db").resolve())
        self.assertNotEqual(resolved, (Path.cwd() / "data" / "vector_db").resolve())

    def test_absolute_chroma_path_is_preserved(self):
        absolute_path = (PROJECT_ROOT / "custom_vector_db").resolve()

        self.assertEqual(resolve_vector_db_dir(str(absolute_path)), absolute_path)
