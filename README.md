# RUTA10 — equipamiento vial (dropshipping)

Landing de un emprendimiento de dropshipping para el rubro vial: señalización,
balizamiento, seguridad vial (EPP), topografía y demarcación. Sin maquinaria
ni repuestos — es un catálogo pensado para no superponerse con lo que vende
Biscayne Servicios.

- **`index.html`** — sitio completo (un solo archivo, sin build). Estética
  inspirada en [goar.com.ar](https://www.goar.com.ar/) reinterpretada con
  paleta de ruta (asfalto + naranja vial), estructura clásica de landing de
  e-commerce: header + WhatsApp, hero, catálogo, "cómo funciona", footer.
- **`PRODUCTOS.md`** — los 5 productos elegidos, criterio de por qué esos y
  no otros, y de dónde sale cada precio de referencia.

## Ver el sitio

No requiere instalación. Abrí `index.html` directo en el navegador, o serví
la carpeta con cualquier server estático:

```bash
python3 -m http.server 8000
# http://localhost:8000/index.html
```

## Antes de publicarlo

1. **WhatsApp:** en `index.html`, buscá `WHATSAPP_NUMBER` (al final del
   archivo) y poné el número real en formato `54 9 + código de área + número`
   sin espacios ni signos. Ese único valor alimenta el botón del header, el
   flotante y el del footer.
2. **Precios:** están hardcodeados en las `product-card` de `index.html`,
   calculados como referencia base + 10% (ver `PRODUCTOS.md`). Confirmalos
   antes de vender — Mercado Libre y las pinturerías cambian precio seguido.
3. **Dominio/marca:** "RUTA10" es un nombre placeholder (juega con la ruta y
   con el 10% de margen). Cambialo si preferís otro — aparece en el logo del
   header y del footer, y en el `<title>`.
4. **Fotos reales:** los íconos son ilustraciones simples en SVG (para no
   usar imágenes de terceros sin permiso). Cuando tengas proveedor
   confirmado, reemplazalos por fotos reales del producto.

## Próximos pasos sugeridos

- Sacar precios de un Google Sheet en vez de tenerlos en el HTML, para
  actualizarlos sin tocar código.
- Sumar botón de compra directa (Mercado Pago) si el volumen lo justifica —
  para arrancar, "consultar por WhatsApp" alcanza y evita cobrar antes de
  tener confirmado el precio del proveedor.
- Publicar en GitHub Pages: Settings → Pages → Deploy from branch → rama
  actual, carpeta `/ (root)`.
