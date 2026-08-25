"""
Extractor de datos de facturas -> Excel.

App web local (Flask): se suben facturas en PDF/JPG/PNG y se descarga un
Excel con los datos extraídos de cada una.

Uso:
    python3 app.py
    (abrir http://localhost:5000 en el navegador)
"""
from __future__ import annotations

import io
from datetime import datetime

from flask import Flask, render_template, request, send_file, jsonify

from core.excel_export import generar_excel
from core.ocr import extraer_texto
from core.parser import FacturaExtraida, parsear_factura

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024  # 100 MB por request

EXTENSIONES_VALIDAS = {"pdf", "jpg", "jpeg", "png", "bmp", "tif", "tiff", "webp"}


def _extension_valida(nombre: str) -> bool:
    return "." in nombre and nombre.rsplit(".", 1)[-1].lower() in EXTENSIONES_VALIDAS


@app.route("/")
def index():
    return render_template("index.html", extensiones=sorted(EXTENSIONES_VALIDAS))


@app.route("/procesar", methods=["POST"])
def procesar():
    archivos = request.files.getlist("facturas")
    archivos = [a for a in archivos if a and a.filename]

    if not archivos:
        return jsonify({"error": "No se recibió ningún archivo."}), 400

    facturas: list[FacturaExtraida] = []

    for archivo in archivos:
        nombre = archivo.filename
        if not _extension_valida(nombre):
            facturas.append(
                FacturaExtraida(
                    archivo=nombre,
                    metodo="ocr",
                    error=f"Formato no soportado ({nombre.rsplit('.', 1)[-1] if '.' in nombre else '?'}).",
                )
            )
            continue
        try:
            contenido = archivo.read()
            extraido = extraer_texto(nombre, contenido)
            factura = parsear_factura(nombre, extraido.texto, extraido.metodo)
        except Exception as exc:  # se sigue con el resto de las facturas
            factura = FacturaExtraida(archivo=nombre, metodo="ocr", error=f"No se pudo procesar: {exc}")
        facturas.append(factura)

    excel_bytes = generar_excel(facturas)
    nombre_salida = f"facturas_extraidas_{datetime.now().strftime('%Y-%m-%d_%H%M')}.xlsx"

    return send_file(
        io.BytesIO(excel_bytes),
        as_attachment=True,
        download_name=nombre_salida,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


if __name__ == "__main__":
    # Se sirve solo en localhost: es una herramienta de uso local, no debe
    # exponerse en la red (el modo debug de Flask permite ejecución remota
    # de código si quedara accesible desde otras máquinas).
    app.run(host="127.0.0.1", port=5000, debug=False)
