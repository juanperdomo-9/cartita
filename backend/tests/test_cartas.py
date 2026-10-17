"""Tests mínimos de CLAUDE.md: tokens, permisos, cuenta regresiva, eventos, archivos y textos."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.db import get_sessionmaker
from app.models import Carta, Lectura
from app.services.archivos import MAX_FOTO

JPG = b"\xff\xd8\xff\xe0" + b"\x00" * 200
M4A = b"\x00\x00\x00\x20ftypM4A " + b"\x00" * 200


def nueva_carta(cliente, **extra) -> dict:
    datos = {"para": "Ma", "de": "Sofi, Juan y Tomi", "titulo": "Hola", "carta": "Te quiero"}
    datos.update(extra)
    r = cliente.post("/api/cartas", json=datos)
    assert r.status_code == 201, r.text
    return r.json()


def publicar(cliente, c: dict) -> None:
    r = cliente.post(f"/api/cartas/{c['id']}/publicar", headers={"X-Token-Admin": c["token_admin"]})
    assert r.status_code == 200


def subir(cliente, c: dict, contenido: bytes, **pedido) -> tuple[int, dict]:
    pedido = {
        "tipo": "foto",
        "rol": "principal",
        "mime": "image/jpeg",
        "bytes": len(contenido),
    } | pedido
    r = cliente.post(
        f"/api/cartas/{c['id']}/archivos", json=pedido, headers={"X-Token-Admin": c["token_admin"]}
    )
    if r.status_code != 201:
        return r.status_code, r.json()
    firmado = r.json()
    s = firmado["subida"]
    assert cliente.request(
        s["metodo"], s["url"], content=contenido, headers=s["headers"]
    ).is_success
    r = cliente.post(
        f"/api/archivos/{firmado['id']}/confirmar", headers={"X-Token-Admin": c["token_admin"]}
    )
    return r.status_code, r.json()


def lectura(carta_id: str) -> Lectura | None:
    with get_sessionmaker()() as db:
        return db.get(Lectura, carta_id)


# ---------- Tokens ----------
def test_crear_devuelve_slug_y_tokens_y_guarda_solo_hashes(cliente):
    c = nueva_carta(cliente)
    assert len(c["slug"]) == 10 and c["slug"].isalnum()
    assert len(c["token_familia"]) >= 32 and len(c["token_admin"]) >= 32
    with get_sessionmaker()() as db:
        carta = db.scalar(select(Carta).where(Carta.slug == c["slug"]))
        guardado = [str(getattr(carta, col.key)) for col in Carta.__table__.columns]
    assert c["token_familia"] not in " ".join(guardado)
    assert c["token_admin"] not in " ".join(guardado)
    assert carta.token_admin_hash != c["token_admin"]


def test_seguimiento_devuelve_el_link_de_la_familia(cliente):
    c = nueva_carta(cliente)
    r = cliente.get(f"/api/e/{c['token_admin']}")
    assert r.status_code == 200
    assert r.json()["token_familia"] == c["token_familia"]
    assert r.json()["slug"] == c["slug"]


def test_token_equivocado_no_ve_seguimiento_ni_sube_ni_oculta(cliente):
    c = nueva_carta(cliente)
    malo = "x" * 32
    assert cliente.get(f"/api/e/{malo}").status_code == 404
    assert cliente.get(f"/api/e/{c['token_familia']}").status_code == 404
    r = cliente.post(
        f"/api/cartas/{c['id']}/archivos",
        json={"tipo": "foto", "rol": "principal", "mime": "image/jpeg", "bytes": 10},
        headers={"X-Token-Admin": c["token_familia"]},
    )
    assert r.status_code == 404
    m = cliente.post(
        f"/api/s/{c['token_familia']}/mensajes", json={"nombre": "Papá", "texto": "Hola"}
    )
    r = cliente.patch(f"/api/e/{malo}/mensajes/{m.json()['id']}", json={"visible": False})
    assert r.status_code == 404
    assert cliente.post(f"/api/cartas/{c['id']}/publicar").status_code == 404


# ---------- Cuenta regresiva ----------
def test_antes_de_abre_desde_no_devuelve_contenido(cliente):
    futuro = (datetime.now(UTC) + timedelta(days=2)).isoformat()
    c = nueva_carta(cliente, abre_desde=futuro, carta="Secreto")
    subir(cliente, c, JPG)
    publicar(cliente, c)
    r = cliente.get(f"/api/c/{c['slug']}")
    assert r.status_code == 200
    body = r.json()
    assert body["estado"] == "espera" and body["contenido"] is None
    assert "Secreto" not in r.text and "almacen" not in r.text
    assert body["para"] == "Ma" and body["abre_desde"]
    # Ni abrir ni abrazar antes de tiempo
    assert cliente.post(f"/api/c/{c['slug']}/eventos", json={"tipo": "abierta"}).status_code == 409


def test_carta_abierta_trae_textos_fotos_y_mensajes(cliente):
    c = nueva_carta(cliente)
    assert subir(cliente, c, JPG)[0] == 200
    publicar(cliente, c)
    body = cliente.get(f"/api/c/{c['slug']}").json()
    assert body["estado"] == "abierta"
    assert body["contenido"]["carta"] == "Te quiero"
    foto = body["contenido"]["fotos"]["principal"]
    assert foto and cliente.get(foto["url"]).content == JPG


def test_borrador_no_se_ve(cliente):
    c = nueva_carta(cliente)
    assert cliente.get(f"/api/c/{c['slug']}").status_code == 404


# ---------- Eventos ----------
def test_ver_desde_seguimiento_no_registra_eventos(cliente):
    c = nueva_carta(cliente)
    publicar(cliente, c)
    r = cliente.get(f"/api/e/{c['token_admin']}/carta")
    assert r.status_code == 200 and r.json()["contenido"]["carta"] == "Te quiero"
    assert lectura(c["id"]) is None


def test_visto_y_abierta_solo_la_primera_vez_y_abrazos_suman(cliente):
    c = nueva_carta(cliente)
    publicar(cliente, c)
    url = f"/api/c/{c['slug']}/eventos"
    cliente.post(url, json={"tipo": "visto"})
    cliente.post(url, json={"tipo": "abierta"})
    primera = lectura(c["id"])
    cliente.post(url, json={"tipo": "visto"})
    cliente.post(url, json={"tipo": "abierta"})
    cliente.post(url, json={"tipo": "abrazos", "cantidad": 3})
    cliente.post(url, json={"tipo": "abrazos", "cantidad": 4})
    cliente.post(url, json={"tipo": "respuesta", "texto": "Me hiciste llorar"})
    final = lectura(c["id"])
    assert final.visto_a == primera.visto_a and final.abierta_a == primera.abierta_a
    assert final.abrazos == 7
    assert final.respuesta == "Me hiciste llorar"
    seg = cliente.get(f"/api/e/{c['token_admin']}").json()["lectura"]
    assert seg["abrazos"] == 7 and seg["abierta_a"]


# ---------- Archivos ----------
def test_rechaza_archivos_grandes_de_otro_tipo_o_de_mas(cliente):
    c = nueva_carta(cliente)
    assert subir(cliente, c, b"x" * 10, bytes=MAX_FOTO + 1)[0] == 422
    assert subir(cliente, c, JPG, mime="application/pdf")[0] == 422
    assert subir(cliente, c, JPG, tipo="audio", rol="principal", mime="audio/mp4")[0] == 422
    # Declara JPG pero es otra cosa: se rechaza al confirmar
    assert subir(cliente, c, b"%PDF-1.4" + b"\x00" * 50)[0] == 422
    assert subir(cliente, c, JPG)[0] == 200
    assert subir(cliente, c, JPG)[0] == 422  # una sola foto de recuerdo
    for i in range(4):
        assert (
            subir(cliente, c, M4A, tipo="audio", rol="audio_autor", mime="audio/mp4", orden=i)[0]
            == 200
        )
    assert subir(cliente, c, M4A, tipo="audio", rol="audio_autor", mime="audio/mp4")[0] == 422
    assert (
        subir(cliente, c, M4A, tipo="audio", rol="audio_autor", mime="audio/mp4", duracion_seg=120)[
            0
        ]
        == 422
    )


# ---------- Familia ----------
def test_mensaje_oculto_no_aparece_en_la_carta(cliente):
    c = nueva_carta(cliente)
    publicar(cliente, c)
    fam = f"/api/s/{c['token_familia']}"
    assert cliente.get(fam).json() == {
        "ocasion": "dia_madre",
        "para": "Ma",
        "de": "Sofi, Juan y Tomi",
    }
    m1 = cliente.post(f"{fam}/mensajes", json={"nombre": "Papá", "texto": "Te amo"}).json()
    cliente.post(f"{fam}/mensajes", json={"nombre": "Tía Ceci", "texto": "Feliz día"})
    r = cliente.post(
        f"{fam}/mensajes/{m1['id']}/archivos",
        json={"tipo": "foto", "mime": "image/jpeg", "bytes": len(JPG)},
    )
    s = r.json()["subida"]
    cliente.request(s["metodo"], s["url"], content=JPG, headers=s["headers"])
    ok = cliente.post(
        f"/api/archivos/{r.json()['id']}/confirmar", headers={"X-Token-Familia": c["token_familia"]}
    )
    assert ok.status_code == 200
    nombres = [
        m["nombre"] for m in cliente.get(f"/api/c/{c['slug']}").json()["contenido"]["mensajes"]
    ]
    assert nombres == ["Papá", "Tía Ceci"]

    cliente.patch(f"/api/e/{c['token_admin']}/mensajes/{m1['id']}", json={"visible": False})
    body = cliente.get(f"/api/c/{c['slug']}").json()["contenido"]
    assert [m["nombre"] for m in body["mensajes"]] == ["Tía Ceci"]
    assert "Te amo" not in str(body)


# ---------- Textos y canción ----------
def test_textos_de_mas_se_rechazan(cliente):
    assert cliente.post("/api/cartas", json={"para": "M" * 21, "de": "Yo"}).status_code == 422
    assert (
        cliente.post(
            "/api/cartas", json={"para": "Ma", "de": "Yo", "carta": "a" * 2001}
        ).status_code
        == 422
    )
    assert (
        cliente.post(
            "/api/cartas", json={"para": "Ma", "de": "Yo", "gracias": ["a"] * 7}
        ).status_code
        == 422
    )
    assert cliente.post("/api/cartas", json={"para": "", "de": "Yo"}).status_code == 422
    r = cliente.post(f"/api/s/{'x' * 32}/mensajes", json={"nombre": "a", "texto": "b" * 301})
    assert r.status_code == 422


def test_cancion_solo_youtube_o_spotify_y_se_guarda_tipo_e_id(cliente):
    c = nueva_carta(cliente, cancion="https://youtu.be/dQw4w9WgXcQ?si=abc")
    publicar(cliente, c)
    cancion = cliente.get(f"/api/c/{c['slug']}").json()["contenido"]["cancion"]
    assert cancion == {"tipo": "youtube", "id": "dQw4w9WgXcQ"}

    c = nueva_carta(cliente, cancion="open.spotify.com/intl-es/track/4uLU6hMCjMI75M1A2tKUQC?si=1")
    publicar(cliente, c)
    assert cliente.get(f"/api/c/{c['slug']}").json()["contenido"]["cancion"]["tipo"] == "spotify"

    for malo in (
        "https://open.spotify.com/album/4uLU6hMCjMI75M1A2tKUQC",
        "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
        "https://www.youtube.com/playlist?list=PL123",
        "https://vimeo.com/123",
    ):
        assert (
            cliente.post(
                "/api/cartas", json={"para": "Ma", "de": "Yo", "cancion": malo}
            ).status_code
            == 422
        )


def test_fecha_de_apertura_pasada_se_rechaza(cliente):
    pasado = (datetime.now(UTC) - timedelta(hours=1)).isoformat()
    assert (
        cliente.post(
            "/api/cartas", json={"para": "Ma", "de": "Yo", "abre_desde": pasado}
        ).status_code
        == 422
    )


def test_ocasion_inactiva_se_rechaza(cliente):
    r = cliente.post("/api/cartas", json={"para": "Pa", "de": "Yo", "ocasion": "dia_padre"})
    assert r.status_code == 422


# ---------- Límites y cabeceras ----------
def test_limite_por_ip_para_crear_cartas(cliente):
    for _ in range(20):
        nueva_carta(cliente)
    assert cliente.post("/api/cartas", json={"para": "Ma", "de": "Yo"}).status_code == 429


def test_api_responde_noindex(cliente):
    assert cliente.get("/health").headers["X-Robots-Tag"] == "noindex"


# ---------- Editar ----------
def test_editar_textos_y_archivos(cliente):
    c = nueva_carta(cliente, cancion="https://youtu.be/dQw4w9WgXcQ")
    publicar(cliente, c)
    assert subir(cliente, c, JPG)[0] == 200
    seg = f"/api/e/{c['token_admin']}"

    e = cliente.get(seg + "/editar").json()
    assert e["datos"]["carta"] == "Te quiero"
    assert e["datos"]["cancion"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    foto = e["archivos"][0]
    assert foto["rol"] == "principal" and cliente.get(foto["url"]).content == JPG

    datos = e["datos"] | {"carta": "Te quiero mucho", "titulo": "Nuevo título"}
    assert cliente.put(seg, json=datos).status_code == 200
    body = cliente.get(f"/api/c/{c['slug']}").json()["contenido"]
    assert body["carta"] == "Te quiero mucho" and body["titulo"] == "Nuevo título"
    assert cliente.put(seg, json=datos | {"carta": "a" * 701}).status_code == 422

    # Cambiar la foto del recuerdo: se borra la vieja y se sube otra
    assert subir(cliente, c, JPG)[0] == 422  # ya hay una
    assert cliente.delete(f"{seg}/archivos/{foto['id']}").status_code == 204
    assert cliente.get(f"/api/c/{c['slug']}").json()["contenido"]["fotos"]["principal"] is None
    assert subir(cliente, c, JPG)[0] == 200
    # Sumar audios después de crear la carta
    assert subir(cliente, c, M4A, tipo="audio", rol="audio_autor", mime="audio/mp4")[0] == 200
    assert len(cliente.get(f"/api/c/{c['slug']}").json()["contenido"]["audios"]) == 1


def test_editar_con_token_equivocado_o_archivo_de_la_familia(cliente):
    c = nueva_carta(cliente)
    publicar(cliente, c)
    malo = "x" * 32
    assert cliente.get(f"/api/e/{malo}/editar").status_code == 404
    assert cliente.put(f"/api/e/{malo}", json={"para": "Ma", "de": "Yo"}).status_code == 404
    fam = f"/api/s/{c['token_familia']}"
    m = cliente.post(f"{fam}/mensajes", json={"nombre": "Papá", "texto": "Hola"}).json()
    r = cliente.post(
        f"{fam}/mensajes/{m['id']}/archivos",
        json={"tipo": "foto", "mime": "image/jpeg", "bytes": len(JPG)},
    ).json()
    # El de la familia no se borra desde editar (se oculta el mensaje)
    assert cliente.delete(f"/api/e/{c['token_admin']}/archivos/{r['id']}").status_code == 404


def test_videos_en_la_pila(cliente):
    c = nueva_carta(cliente)
    publicar(cliente, c)
    mp4 = b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 200
    video = {"tipo": "video", "rol": "pila", "mime": "video/mp4", "duracion_seg": 10}
    assert subir(cliente, c, mp4, **video)[0] == 200
    assert subir(cliente, c, mp4, **video, duracion_seg=90)[0] == 422
    assert subir(cliente, c, mp4, **(video | {"rol": "principal"}))[0] == 422
    pila = cliente.get(f"/api/c/{c['slug']}").json()["contenido"]["fotos"]["pila"]
    assert pila[0]["tipo"] == "video"
