"""
Extracción de texto crudo desde facturas en PDF o imagen.

Estrategia:
  - PDF: primero se intenta leer la capa de texto nativa (mucho más confiable
    que el OCR). Si el PDF no tiene texto (es un escaneo), se renderiza cada
    página como imagen y se le aplica OCR.
  - Imágenes (JPG, PNG, BMP, TIFF, WEBP): se les aplica OCR directamente.
"""
from __future__ import annotations

import io
from dataclasses import dataclass

import pymupdf  # PyMuPDF
import pytesseract
from PIL import Image, ImageOps

# Idiomas para tesseract: español + inglés (muchas facturas mezclan términos
# en inglés, ej. "Invoice", "Total"). Si el paquete de idioma "spa" no está
# instalado, se hace fallback a "eng".
OCR_LANGS = "spa+eng"

# Umbral de caracteres por página para considerar que un PDF ya tiene texto
# "real" (no escaneado) y no hace falta OCR.
MIN_CHARS_PER_PAGE_SIN_OCR = 25

# Zoom aplicado al renderizar páginas de PDF antes de pasarlas por OCR.
# A mayor zoom, mejor resolución para el OCR (más lento).
PDF_RENDER_ZOOM = 2.5

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}
PDF_EXTENSIONS = {".pdf"}


@dataclass
class TextoExtraido:
    texto: str
    metodo: str  # "texto_pdf" | "ocr"
    paginas: int


def _ocr_lang_seguro() -> str:
    """Usa spa+eng si está disponible; si no, cae a eng."""
    try:
        disponibles = set(pytesseract.get_languages(config=""))
    except Exception:
        return "eng"
    partes = [p for p in OCR_LANGS.split("+") if p in disponibles]
    return "+".join(partes) if partes else "eng"


def _preprocesar_imagen(img: Image.Image) -> Image.Image:
    """Mejoras simples para subir la precisión del OCR."""
    img = img.convert("L")  # escala de grises
    img = ImageOps.autocontrast(img)
    # Si la imagen es muy chica, se agranda para que tesseract tenga más detalle.
    ancho, alto = img.size
    if max(ancho, alto) < 1500:
        factor = 1500 / max(ancho, alto)
        img = img.resize((int(ancho * factor), int(alto * factor)), Image.LANCZOS)
    return img


def _ocr_imagen(img: Image.Image, lang: str) -> str:
    img = _preprocesar_imagen(img)
    return pytesseract.image_to_string(img, lang=lang)


def extraer_de_imagen(contenido: bytes) -> TextoExtraido:
    img = Image.open(io.BytesIO(contenido))
    lang = _ocr_lang_seguro()
    texto = _ocr_imagen(img, lang)
    return TextoExtraido(texto=texto, metodo="ocr", paginas=1)


def extraer_de_pdf(contenido: bytes) -> TextoExtraido:
    doc = pymupdf.open(stream=contenido, filetype="pdf")
    try:
        textos_nativos = [pagina.get_text() for pagina in doc]
        promedio = sum(len(t.strip()) for t in textos_nativos) / max(len(textos_nativos), 1)

        if promedio >= MIN_CHARS_PER_PAGE_SIN_OCR:
            return TextoExtraido(
                texto="\n".join(textos_nativos), metodo="texto_pdf", paginas=len(doc)
            )

        # PDF escaneado (sin capa de texto útil): OCR página por página.
        lang = _ocr_lang_seguro()
        partes = []
        matriz = pymupdf.Matrix(PDF_RENDER_ZOOM, PDF_RENDER_ZOOM)
        for pagina in doc:
            pix = pagina.get_pixmap(matrix=matriz)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            partes.append(_ocr_imagen(img, lang))
        return TextoExtraido(texto="\n".join(partes), metodo="ocr", paginas=len(doc))
    finally:
        doc.close()


def extraer_texto(nombre_archivo: str, contenido: bytes) -> TextoExtraido:
    """Punto de entrada único: detecta el tipo de archivo por extensión."""
    ext = "." + nombre_archivo.rsplit(".", 1)[-1].lower() if "." in nombre_archivo else ""
    if ext in PDF_EXTENSIONS:
        return extraer_de_pdf(contenido)
    if ext in IMAGE_EXTENSIONS:
        return extraer_de_imagen(contenido)
    raise ValueError(
        f"Formato no soportado: '{ext}'. Formatos válidos: PDF, JPG, PNG, BMP, TIFF, WEBP."
    )
