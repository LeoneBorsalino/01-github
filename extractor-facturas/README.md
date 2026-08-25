# Extractor de Facturas a Excel

Herramienta web local para cargar facturas de distintos proveedores (PDF, JPG,
PNG u otros formatos de imagen) y extraer sus datos automáticamente a un
archivo Excel.

## ¿Cómo funciona?

1. **Lectura del texto**: si el archivo es un PDF con texto seleccionable, se
   lee directamente (más rápido y confiable). Si es un PDF escaneado o una
   imagen (JPG/PNG/etc.), se le aplica **OCR** con [Tesseract](https://github.com/tesseract-ocr/tesseract).
2. **Extracción de campos**: sobre el texto obtenido se buscan, con reglas y
   palabras clave típicas de facturas en español, los siguientes datos:
   - **Básicos**: proveedor, N° de factura, fecha de emisión, fecha de
     vencimiento, subtotal, IVA, total.
   - **Fiscales**: CUIT/RFC/NIF del proveedor y del cliente, condición frente
     al IVA, moneda.
   - **Ítems de línea**: descripción, cantidad, precio unitario e importe de
     cada renglón de la factura (cuando se puede identificar una tabla).
3. **Excel de salida** con 3 hojas:
   - `Facturas`: un renglón por factura con todos los datos básicos/fiscales
     y una columna **Estado** (`OK` / `Revisar` / `ERROR`) más
     **Observaciones** indicando qué campo no se pudo detectar.
   - `Items`: el detalle de renglones de cada factura.
   - `Texto OCR (verificación)`: el texto crudo extraído de cada archivo, para
     poder verificar o corregir a mano lo que el parser no haya interpretado bien.

> ⚠️ **Importante sobre la precisión**: la extracción es por reglas (regex +
> palabras clave), no por inteligencia artificial. Funciona bien con facturas
> con textos/etiquetas típicos ("Factura N°", "CUIT", "Total", "Fecha de
> Emisión", etc.), pero con diseños muy atípicos puede fallar en algún campo.
> Por eso cada factura queda marcada con su estado — revisá siempre las que
> digan "Revisar" o "ERROR" contra el texto crudo en la última hoja.

## Instalación

Requiere Python 3.9+ y el binario de **Tesseract OCR** instalado en el
sistema (además de las librerías Python del proyecto).

```bash
# 1) Instalar Tesseract (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-spa

# macOS (Homebrew)
brew install tesseract tesseract-lang

# Windows: instalar desde https://github.com/UB-Mannheim/tesseract/wiki
# y agregar la carpeta de instalación al PATH.

# 2) Instalar dependencias Python (idealmente en un entorno virtual)
cd extractor-facturas
python3 -m venv .venv
source .venv/bin/activate   # en Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Uso

```bash
python3 app.py
```

Abrí `http://localhost:5000` en el navegador, arrastrá o seleccioná las
facturas (podés mezclar PDF e imágenes de distintos proveedores en la misma
tanda) y hacé clic en **"Extraer datos y generar Excel"**. El archivo Excel
se descarga automáticamente al terminar.

## Estructura del proyecto

```
extractor-facturas/
├── app.py                  # Servidor Flask (rutas: "/" y "/procesar")
├── core/
│   ├── ocr.py               # Lectura de texto de PDF/imagen (nativo u OCR)
│   ├── parser.py            # Reglas para extraer campos del texto
│   └── excel_export.py      # Armado del archivo Excel de salida
├── templates/index.html     # Página de carga (drag & drop)
├── static/{app.js,style.css}
└── requirements.txt
```

## Mejorar la precisión para tus proveedores

Como la extracción es por reglas, si notás que sistemáticamente falla algún
campo con tus proveedores habituales, se puede ajustar agregando las palabras
clave que usan esas facturas en `core/parser.py` (listas como
`CONDICIONES_IVA`, o las keywords que recibe cada llamada a
`_buscar_por_keywords`).
