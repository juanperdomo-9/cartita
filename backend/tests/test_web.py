"""Un solo servicio: el backend sirve la web compilada y la API en el mismo lugar."""

from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import crear_app


def test_sirve_la_web_y_la_api(tmp_path, monkeypatch):
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "app.js").write_text("console.log(1)")
    (tmp_path / "og.png").write_bytes(b"\x89PNG")
    (tmp_path / "index.html").write_text(
        '<meta property="og:image" content="%VITE_SITIO_URL%/og.png"><div id="root"></div>'
    )
    monkeypatch.setenv("FRONTEND_DIST", str(tmp_path))
    monkeypatch.setenv("RENDER_EXTERNAL_URL", "https://cartita.onrender.com")
    get_settings.cache_clear()
    try:
        cliente = TestClient(crear_app())
        for ruta in ("/", "/dia-de-la-madre", "/c/abc123", "/e/token/carta"):
            r = cliente.get(ruta)
            assert r.status_code == 200 and 'id="root"' in r.text
            assert "https://cartita.onrender.com/og.png" in r.text
            assert r.headers["X-Robots-Tag"] == "noindex"
        assert cliente.get("/assets/app.js").text == "console.log(1)"
        assert cliente.get("/og.png").content == b"\x89PNG"
        assert cliente.get("/health").json() == {"estado": "ok"}
        assert cliente.get("/api/no-existe").status_code == 404
        assert "dependencies" not in cliente.get("/..%2Fpyproject.toml").text
    finally:
        get_settings.cache_clear()
