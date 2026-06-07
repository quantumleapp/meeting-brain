from app.config import Settings


def test_settings_have_defaults():
    s = Settings()
    assert s.embedding_dim == 1024
    assert s.database_url.startswith("postgresql://")
