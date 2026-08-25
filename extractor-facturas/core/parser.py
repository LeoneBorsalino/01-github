"""
Extracción de campos estructurados a partir del texto crudo de una factura.

Enfoque: heurísticas + expresiones regulares alrededor de palabras clave
habituales en facturas en español (Argentina y genéricas). No depende de un
formato fijo por proveedor, pero al ser basado en reglas no es 100% preciso
con diseños muy atípicos: por eso cada factura se marca con un estado
("OK" / "Revisar") y se conserva el texto crudo en una hoja aparte del Excel
para que se pueda verificar y corregir a mano.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from typing import Optional

from dateutil import parser as dateparser

# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

CUIT_REGEX = re.compile(r"\b(\d{2}-?\d{8}-?\d{1})\b")
TAX_ID_GENERICO_REGEX = re.compile(r"\b([A-Z0-9][A-Z0-9\-\.]{6,14}[A-Z0-9])\b")
DATE_REGEX = re.compile(r"(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})")
MONTO_REGEX = re.compile(r"([\$€]?\s?-?\d[\d\.,]*\d|\$?\s?-?\d)")
INVOICE_NUM_REGEX = re.compile(r"(\d{1,5}\s?-?\s?\d{5,8})")

CONDICIONES_IVA = [
    "Responsable Inscripto",
    "Responsable Monotributo",
    "Monotributista",
    "Monotributo",
    "Consumidor Final",
    "Sujeto Exento",
    "Exento",
    "No Responsable",
]

STOP_KEYWORDS_NOMBRE = [
    "CUIT",
    "FACTURA",
    "FACT.",
    "FECHA",
    "FEC.",
    "DOMICILIO",
    "PUNTO DE VENTA",
    "COMP. NRO",
    "INGRESOS BRUTOS",
    "RAZ",
    "TEL",
    "IVA",
    "COD.",
]

ITEM_HEADER_KEYWORDS = ["CANT", "DESCRIP", "DETALLE", "PRECIO", "P. UNIT", "IMPORTE", "UNITARIO", "ARTICULO", "ARTÍCULO"]
ITEM_STOP_KEYWORDS = ["SUBTOTAL", "TOTAL", "OBSERVAC", "IVA 21", "IVA 10", "SON PESOS", "FORMA DE PAGO"]

ITEM_LINE_REGEX = re.compile(
    r"^(?P<cant>\d+(?:[.,]\d+)?)\s+(?P<desc>.+?)\s+(?P<preciou>[\d\.,]+)\s+(?P<importe>[\d\.,]+)\s*$"
)
NUMERO_AL_FINAL_REGEX = re.compile(r"([\d\.,]+)\s*$")


def normalizar_monto(bruto: Optional[str]) -> Optional[float]:
    """Convierte '1.234,56' / '1,234.56' / '1234.56' -> float 1234.56."""
    if not bruto:
        return None
    s = re.sub(r"[^\d.,\-]", "", bruto.strip())
    if not s or s in {"-", ".", ","}:
        return None
    negativo = s.startswith("-")
    s = s.lstrip("-")

    if "," in s and "." in s:
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "," in s:
        partes = s.split(",")
        if len(partes) == 2 and len(partes[1]) == 2:
            s = s.replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "." in s:
        partes = s.split(".")
        if len(partes) == 2 and len(partes[1]) == 3:
            s = s.replace(".", "")

    try:
        val = float(s)
    except ValueError:
        return None
    return -val if negativo else val


def normalizar_fecha(bruto: Optional[str]) -> Optional[date]:
    if not bruto:
        return None
    try:
        return dateparser.parse(bruto, dayfirst=True, fuzzy=True).date()
    except Exception:
        return None


def _compilar_keywords(keywords: list[str]) -> re.Pattern:
    """Compila las keywords con límites de palabra "manuales" (no \\b, que no
    corta bien con acentos/°/%) para evitar falsos positivos como "IVA"
    matcheando dentro de "Viva" o "Total" dentro de "Subtotal"."""
    partes = [
        r"(?<![A-Za-zÀ-ÿ])" + re.escape(k) + r"(?![A-Za-zÀ-ÿ])" for k in keywords
    ]
    return re.compile("(" + "|".join(partes) + ")", re.IGNORECASE)


def _buscar_por_keywords(
    lineas: list[str], keywords: list[str], patron_valor: re.Pattern, lookahead: int = 1
) -> Optional[str]:
    kw_pat = _compilar_keywords(keywords)
    for i, linea in enumerate(lineas):
        m = kw_pat.search(linea)
        if not m:
            continue
        resto = linea[m.end():]
        val = patron_valor.search(resto)
        if val:
            return val.group(1) if val.groups() else val.group(0)
        for j in range(1, lookahead + 1):
            if i + j < len(lineas):
                val = patron_valor.search(lineas[i + j])
                if val:
                    return val.group(1) if val.groups() else val.group(0)
    return None


def _extraer_cuits(texto: str) -> list[str]:
    encontrados = []
    for m in CUIT_REGEX.finditer(texto):
        v = m.group(1)
        if v not in encontrados:
            encontrados.append(v)
    return encontrados


def _extraer_nombre_proveedor(lineas: list[str]) -> Optional[str]:
    explicito = _buscar_por_keywords(
        lineas, ["Razón Social", "Razon Social", "Nombre o Razón Social"], re.compile(r"[:\-]?\s*(.+\S)")
    )
    if explicito:
        return explicito.strip(" :-")
    for linea in lineas[:8]:
        if len(linea) < 2:
            continue
        if any(k in linea.upper() for k in STOP_KEYWORDS_NOMBRE):
            break
        return linea.strip()
    return None


def _extraer_nombre_cliente(lineas: list[str]) -> Optional[str]:
    valor = _buscar_por_keywords(
        lineas,
        ["Sr(es)", "Sres.", "Señor(es)", "Cliente:", "Apellido y Nombre", "Nombre y Apellido"],
        re.compile(r"[:\-]?\s*(.+\S)"),
    )
    return valor.strip(" :-") if valor else None


def _extraer_condicion_iva(texto_mayus: str) -> Optional[str]:
    for cond in CONDICIONES_IVA:
        if cond.upper() in texto_mayus:
            return cond
    return None


def _extraer_moneda(texto: str) -> Optional[str]:
    if re.search(r"\bUSD\b|U\$S|US\$", texto, re.IGNORECASE):
        return "USD"
    if re.search(r"\bEUR\b|€", texto, re.IGNORECASE):
        return "EUR"
    if re.search(r"\bARS\b", texto, re.IGNORECASE):
        return "ARS"
    if "$" in texto:
        return "ARS"
    return None


def _extraer_items(lineas: list[str]) -> list[dict]:
    idx_header = None
    for i, linea in enumerate(lineas):
        mayus = linea.upper()
        if sum(1 for k in ITEM_HEADER_KEYWORDS if k in mayus) >= 2:
            idx_header = i
            break
    if idx_header is None:
        return []

    items = []
    for linea in lineas[idx_header + 1:]:
        mayus = linea.upper()
        if any(k in mayus for k in ITEM_STOP_KEYWORDS):
            break
        if len(linea.strip()) < 3:
            continue
        m = ITEM_LINE_REGEX.match(linea.strip())
        if m:
            items.append(
                {
                    "cantidad": normalizar_monto(m.group("cant")),
                    "descripcion": m.group("desc").strip(),
                    "precio_unitario": normalizar_monto(m.group("preciou")),
                    "importe": normalizar_monto(m.group("importe")),
                }
            )
        else:
            m2 = NUMERO_AL_FINAL_REGEX.search(linea.strip())
            items.append(
                {
                    "cantidad": None,
                    "descripcion": linea.strip(),
                    "precio_unitario": None,
                    "importe": normalizar_monto(m2.group(1)) if m2 else None,
                }
            )
    return items


@dataclass
class FacturaExtraida:
    archivo: str
    metodo: str
    proveedor: Optional[str] = None
    cuit_proveedor: Optional[str] = None
    cliente: Optional[str] = None
    cuit_cliente: Optional[str] = None
    condicion_iva: Optional[str] = None
    numero_factura: Optional[str] = None
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    moneda: Optional[str] = None
    subtotal: Optional[float] = None
    iva: Optional[float] = None
    total: Optional[float] = None
    items: list[dict] = field(default_factory=list)
    texto_crudo: str = ""
    error: Optional[str] = None

    @property
    def estado(self) -> str:
        if self.error:
            return "ERROR"
        faltantes = self.campos_faltantes()
        return "OK" if not faltantes else "Revisar"

    def campos_faltantes(self) -> list[str]:
        obligatorios = {
            "Proveedor": self.proveedor,
            "N° de factura": self.numero_factura,
            "Fecha de emisión": self.fecha_emision,
            "Total": self.total,
        }
        return [nombre for nombre, valor in obligatorios.items() if not valor]


def parsear_factura(nombre_archivo: str, texto: str, metodo: str) -> FacturaExtraida:
    lineas = [l.strip() for l in texto.splitlines() if l.strip()]
    texto_mayus = texto.upper()

    cuits = _extraer_cuits(texto)
    cuit_proveedor = cuits[0] if len(cuits) >= 1 else None
    cuit_cliente = next((c for c in cuits[1:] if c != cuit_proveedor), None)

    numero_factura = _buscar_por_keywords(
        lineas,
        ["Factura N", "Nro. Factura", "Comp. Nro", "N° Comp", "Nro Comprobante", "Numero de Factura",
         "Número de Factura", "Invoice No", "Invoice #", "N°"],
        INVOICE_NUM_REGEX,
    )

    fecha_emision_raw = _buscar_por_keywords(
        lineas,
        ["Fecha de Emisión", "Fecha de Emision", "Fecha Emisión", "Fecha Emision", "Emitida el", "Fecha:"],
        DATE_REGEX,
    )
    fecha_vto_raw = _buscar_por_keywords(
        lineas,
        ["Fecha de Vencimiento", "Vencimiento", "Fecha Vto", "Vence el", "Due Date"],
        DATE_REGEX,
    )

    subtotal_raw = _buscar_por_keywords(
        lineas, ["Subtotal", "Importe Neto", "Neto Gravado", "Base Imponible"], MONTO_REGEX
    )
    iva_raw = _buscar_por_keywords(lineas, ["IVA 21%", "IVA 10,5%", "I.V.A.", "IVA"], MONTO_REGEX)
    total_raw = _buscar_por_keywords(
        lineas, ["Total a Pagar", "Importe Total", "TOTAL", "Total"], MONTO_REGEX
    )

    return FacturaExtraida(
        archivo=nombre_archivo,
        metodo=metodo,
        proveedor=_extraer_nombre_proveedor(lineas),
        cuit_proveedor=cuit_proveedor,
        cliente=_extraer_nombre_cliente(lineas),
        cuit_cliente=cuit_cliente,
        condicion_iva=_extraer_condicion_iva(texto_mayus),
        numero_factura=numero_factura.strip() if numero_factura else None,
        fecha_emision=normalizar_fecha(fecha_emision_raw),
        fecha_vencimiento=normalizar_fecha(fecha_vto_raw),
        moneda=_extraer_moneda(texto),
        subtotal=normalizar_monto(subtotal_raw),
        iva=normalizar_monto(iva_raw),
        total=normalizar_monto(total_raw),
        items=_extraer_items(lineas),
        texto_crudo=texto,
    )
