const zonaDrop = document.getElementById("zona-drop");
const inputArchivos = document.getElementById("input-archivos");
const listaArchivos = document.getElementById("lista-archivos");
const btnProcesar = document.getElementById("btn-procesar");
const form = document.getElementById("form-facturas");
const estadoProceso = document.getElementById("estado-proceso");
const estadoTexto = document.getElementById("estado-texto");
const mensajeError = document.getElementById("mensaje-error");

let archivosSeleccionados = [];

function formatearTamano(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderizarLista() {
  listaArchivos.innerHTML = "";
  archivosSeleccionados.forEach((archivo, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>📎 ${archivo.name} <small style="color:#9ca3af">(${formatearTamano(archivo.size)})</small></span>
      <button type="button" class="quitar" data-index="${i}" aria-label="Quitar">✕</button>
    `;
    listaArchivos.appendChild(li);
  });
  btnProcesar.disabled = archivosSeleccionados.length === 0;
}

function agregarArchivos(nuevos) {
  for (const f of nuevos) {
    if (!archivosSeleccionados.some((a) => a.name === f.name && a.size === f.size)) {
      archivosSeleccionados.push(f);
    }
  }
  renderizarLista();
}

inputArchivos.addEventListener("change", (e) => {
  agregarArchivos(Array.from(e.target.files));
  inputArchivos.value = "";
});

["dragenter", "dragover"].forEach((evt) =>
  zonaDrop.addEventListener(evt, (e) => {
    e.preventDefault();
    zonaDrop.classList.add("arrastrando");
  })
);

["dragleave", "drop"].forEach((evt) =>
  zonaDrop.addEventListener(evt, (e) => {
    e.preventDefault();
    zonaDrop.classList.remove("arrastrando");
  })
);

zonaDrop.addEventListener("drop", (e) => {
  const archivos = Array.from(e.dataTransfer.files || []);
  agregarArchivos(archivos);
});

listaArchivos.addEventListener("click", (e) => {
  const btn = e.target.closest(".quitar");
  if (!btn) return;
  const idx = Number(btn.dataset.index);
  archivosSeleccionados.splice(idx, 1);
  renderizarLista();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (archivosSeleccionados.length === 0) return;

  mensajeError.hidden = true;
  btnProcesar.disabled = true;
  estadoProceso.hidden = false;
  estadoTexto.textContent = `Procesando ${archivosSeleccionados.length} factura(s)… esto puede tardar unos segundos por archivo.`;

  const formData = new FormData();
  archivosSeleccionados.forEach((f) => formData.append("facturas", f));

  try {
    const resp = await fetch("/procesar", { method: "POST", body: formData });

    if (!resp.ok) {
      let detalle = "Ocurrió un error al procesar las facturas.";
      try {
        const data = await resp.json();
        detalle = data.error || detalle;
      } catch (_) {}
      throw new Error(detalle);
    }

    const blob = await resp.blob();
    const disposicion = resp.headers.get("Content-Disposition") || "";
    const match = disposicion.match(/filename="?([^"]+)"?/);
    const nombreArchivo = match ? match[1] : "facturas_extraidas.xlsx";

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    estadoTexto.textContent = "✅ Listo. Se descargó el Excel con los datos extraídos.";
  } catch (err) {
    mensajeError.textContent = `❌ ${err.message}`;
    mensajeError.hidden = false;
    estadoProceso.hidden = true;
  } finally {
    btnProcesar.disabled = archivosSeleccionados.length === 0;
  }
});
