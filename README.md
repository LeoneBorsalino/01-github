# RUTA10 — equipamiento vial

Landing para un catálogo de rubro vial: señalización, balizamiento, seguridad
vial (EPP), topografía y demarcación. Sin maquinaria ni repuestos — pensado
para no superponerse con lo que vende Biscayne Servicios. El sitio en sí no
menciona el modelo de negocio (dropshipping/stock): de cara al cliente es
una tienda normal, eso queda documentado acá y en `PRODUCTOS.md` para uso
interno.

- **`index.html`** — sitio completo (un solo archivo, sin build). Estética
  inspirada en [goar.com.ar](https://www.goar.com.ar/) reinterpretada con
  paleta de ruta (asfalto + naranja vial): header + WhatsApp, hero, catálogo
  con fotos, reseñas, footer.
- **`images/productos/`** — fotos de stock (Pexels, licencia libre de uso
  comercial) usadas como placeholder de cada producto.
- **`PRODUCTOS.md`** — los 5 productos elegidos, criterio de por qué esos y
  no otros, y de dónde sale cada precio de referencia (uso interno).

## Ver el sitio

No requiere instalación. Abrí `index.html` directo en el navegador, o serví
la carpeta con cualquier server estático:

```bash
python3 -m http.server 8000
# http://localhost:8000/index.html
```

## Ya configurado

- **WhatsApp:** `+54 9 11 3373-9191`. Está seteado en `WHATSAPP_NUMBER` al
  final de `index.html` — ese único valor alimenta el botón del header, el
  flotante y el del footer. Si cambiás de número, se edita solo ahí.
- **Marca:** "RUTA10".

## Antes de escalarlo

1. **Reseñas:** las 6 del final son inventadas, a pedido, para que la
   landing no arranque vacía. Son texto plausible pero no clientes reales —
   convendría reemplazarlas por reseñas genuinas apenas haya pedidos
   entregados (publicar testimonios falsos como si fueran reales puede ser
   problema de lealtad comercial si el sitio ya está en producción, no solo
   de imagen).
2. **Precios:** están hardcodeados en las `product-card` de `index.html`,
   calculados como referencia base + 10% (ver `PRODUCTOS.md`, que sí explica
   el criterio). Confirmalos antes de vender — Mercado Libre y las
   pinturerías cambian precio seguido.
3. **Fotos:** son de stock (Pexels), sirven de placeholder prolijo hasta
   tener fotos propias del producto real que vas a despachar — en dropshipping
   conviene usar las fotos que te pase el proveedor, para que lo que se ve
   sea exactamente lo que se manda.

## Próximos pasos sugeridos

- Sacar precios de un Google Sheet en vez de tenerlos en el HTML, para
  actualizarlos sin tocar código.
- Sumar botón de compra directa (Mercado Pago) si el volumen lo justifica —
  para arrancar, "consultar por WhatsApp" alcanza y evita cobrar antes de
  tener confirmado el precio del proveedor.
- Publicar en GitHub Pages: Settings → Pages → Deploy from branch → rama
  actual, carpeta `/ (root)`.
