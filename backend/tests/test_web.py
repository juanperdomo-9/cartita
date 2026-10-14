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
        for ruta in ("/", "/dia-de-la-madre", "/s/token", "/e/token/carta"):
            r = cliente.get(ruta)
            assert r.status_code == 200 and 'id="root"' in r.text
            assert "https://cartita.onrender.com/og.png" in r.text
            assert r.headers["X-Robots-Tag"] == "noindex"
            assert r.headers["Cache-Control"] == "no-cache"
        assert cliente.get("/assets/app.js").text == "console.log(1)"
        assert cliente.get("/og.png").content == b"\x89PNG"
        assert cliente.get("/health").json() == {"estado": "ok"}
        assert cliente.get("/api/no-existe").status_code == 404
        assert cliente.get("/og-no-existe.jpg").status_code == 404
        assert "dependencies" not in cliente.get("/..%2Fpyproject.toml").text
    finally:
        get_settings.cache_clear()


def test_link_de_ella_lleva_la_vista_previa_elegida(tmp_path, monkeypatch, cliente):
    (tmp_path / "assets").mkdir()
    (tmp_path / "index.html").write_text(
        "<title>Cartita</title>"
        '<meta name="description" content="Cartas digitales que se abren como un regalo." />'
        '<meta property="og:title" content="Cartita" />'
        '<meta property="og:description" content="Cartas digitales" />'
        '<meta property="og:image" content="%VITE_SITIO_URL%/og.png" />'
    )
    c = cliente.post(
        "/api/cartas", json={"para": "Ma", "de": "Juan", "vista_previa": "mira", "carta": "Secreto"}
    ).json()
    cliente.post(f"/api/cartas/{c['id']}/publicar", headers={"X-Token-Admin": c["token_admin"]})
    assert (
        cliente.post(
            "/api/cartas", json={"para": "Ma", "de": "Yo", "vista_previa": "Hola Ma"}
        ).status_code
        == 422
    )

    monkeypatch.setenv("FRONTEND_DIST", str(tmp_path))
    monkeypatch.setenv("RENDER_EXTERNAL_URL", "https://sitio.onrender.com")
    get_settings.cache_clear()
    try:
        web = TestClient(crear_app())
        pagina = web.get(f"/c/{c['slug']}").text
        assert 'og:title" content="Mirá esto 👀"' in pagina
        assert 'og:image" content="https://sitio.onrender.com/og-mira.jpg"' in pagina
        assert "<title>Mirá esto 👀</title>" in pagina
        assert "Ma" not in pagina and "Juan" not in pagina and "Secreto" not in pagina
        # Un slug que no existe sale con la frase por defecto, sin dar pistas
        assert 'og:title" content="Abrilo con sonido 🔊"' in web.get("/c/noexiste99").text
        # El resto de las páginas, con la vista previa de la marca
        assert 'og:title" content="Cartita"' in web.get("/dia-de-la-madre").text
    finally:
        get_settings.cache_clear()
