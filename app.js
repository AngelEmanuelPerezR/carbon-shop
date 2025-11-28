// =======================
// Configuración base
// =======================
const API_BASE = "http://34.233.4.168:5500";

const inventoryTableBody = document.getElementById("inventoryTableBody");
const inventoryMessage = document.getElementById("inventoryMessage");

const selectedProductNameInput = document.getElementById("selectedProductName");
const hiddenProductNameInput = document.getElementById("hiddenProductName");
const nuevoCostoInput = document.getElementById("nuevoCosto");
const nuevasUnidadesInput = document.getElementById("nuevasUnidades");
const updateProductForm = document.getElementById("updateProductForm");
const updateProductMessage = document.getElementById("updateProductMessage");

const changeStatusForm = document.getElementById("changeStatusForm");
const pedidoIdEstadoInput = document.getElementById("pedidoIdEstado");
const nuevoEstadoSelect = document.getElementById("nuevoEstado");
const changeStatusMessage = document.getElementById("changeStatusMessage");

const resumenForm = document.getElementById("resumenForm");
const pedidoIdResumenInput = document.getElementById("pedidoIdResumen");
const resumenTableWrapper = document.getElementById("resumenTableWrapper");
const resumenTableBody = document.getElementById("resumenTableBody");
const resumenMessage = document.getElementById("resumenMessage");

const lastOrdersTableBody = document.getElementById("lastOrdersTableBody");
const lastOrdersMessage = document.getElementById("lastOrdersMessage");
const lastUpdateLabel = document.getElementById("lastUpdateLabel");

const notificationsList = document.getElementById("notificationsList");

const btnReloadInventory = document.getElementById("btnReloadInventory");

const footerYear = document.getElementById("footerYear");
if (footerYear) {
  footerYear.textContent = new Date().getFullYear();
}

// Estado interno para comparar cambios en últimos 10 pedidos
let lastOrdersSnapshot = new Map();

// =======================
// Helpers
// =======================
function formatCurrency(value) {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toFixed(2);
}

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
      return dateStr;
    }
    return d.toLocaleString();
  } catch {
    return dateStr;
  }
}

function setMessage(el, text, type = "info") {
  if (!el) return;
  el.textContent = text || "";
  el.classList.remove("text-success", "text-danger", "text-warning", "text-muted");
  if (type === "success") el.classList.add("text-success");
  else if (type === "error") el.classList.add("text-danger");
  else if (type === "warning") el.classList.add("text-warning");
  else el.classList.add("text-muted");
}

function addNotification(text, type = "info") {
  if (!notificationsList) return;
  const li = document.createElement("li");

  let badgeClass = "bg-secondary";
  if (type === "success") badgeClass = "bg-success";
  else if (type === "warning") badgeClass = "bg-warning text-dark";
  else if (type === "error") badgeClass = "bg-danger";

  const badge = document.createElement("span");
  badge.className = `badge ${badgeClass} me-2`;
  badge.textContent = new Date().toLocaleTimeString();

  const spanText = document.createElement("span");
  spanText.textContent = text;

  li.appendChild(badge);
  li.appendChild(spanText);

  // Insertar al inicio
  notificationsList.insertBefore(li, notificationsList.firstChild);

  // Limitar número de notificaciones
  const maxItems = 6;
  while (notificationsList.children.length > maxItems) {
    notificationsList.removeChild(notificationsList.lastChild);
  }
}

// =======================
// Inventario
// =======================
async function loadInventory() {
  try {
    setMessage(inventoryMessage, "Cargando inventario...", "info");
    const res = await fetch(`${API_BASE}/api/inventario`);
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }
    const data = await res.json();
    if (!data.ok) {
      throw new Error("La API devolvió ok=false");
    }
    const inventario = data.inventario || [];
    inventoryTableBody.innerHTML = "";

    inventario.forEach((prod) => {
      const tr = document.createElement("tr");

      const tdNombre = document.createElement("td");
      tdNombre.textContent = prod.nombre;

      const tdDesc = document.createElement("td");
      tdDesc.textContent = prod.descripcion;

      const tdCosto = document.createElement("td");
      tdCosto.textContent = formatCurrency(prod.costo);

      const tdExist = document.createElement("td");
      tdExist.textContent = prod.unidades_existencia;

      const tdAccion = document.createElement("td");
      tdAccion.className = "text-center";
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-outline-warning";
      btn.textContent = "Actualizar";
      btn.addEventListener("click", () => {
        selectProductForUpdate(prod);
      });
      tdAccion.appendChild(btn);

      tr.appendChild(tdNombre);
      tr.appendChild(tdDesc);
      tr.appendChild(tdCosto);
      tr.appendChild(tdExist);
      tr.appendChild(tdAccion);

      inventoryTableBody.appendChild(tr);
    });

    setMessage(inventoryMessage, `Inventario cargado (${inventario.length} productos).`, "success");
  } catch (err) {
    console.error(err);
    setMessage(inventoryMessage, "Error al cargar el inventario.", "error");
  }
}

function selectProductForUpdate(prod) {
  if (!prod) return;
  hiddenProductNameInput.value = prod.nombre;
  selectedProductNameInput.value = prod.nombre;
  nuevoCostoInput.value = Number(prod.costo);
  nuevasUnidadesInput.value = Number(prod.unidades_existencia);
  setMessage(updateProductMessage, `Producto seleccionado: ${prod.nombre}`, "info");
}

// =======================
// Actualizar producto
// =======================
async function handleUpdateProductSubmit(ev) {
  ev.preventDefault();

  const nombreProducto = hiddenProductNameInput.value.trim();
  const nuevoCosto = nuevoCostoInput.value;
  const nuevasUnidades = nuevasUnidadesInput.value;

  if (!nombreProducto) {
    setMessage(updateProductMessage, "Primero selecciona un producto desde el inventario.", "warning");
    return;
  }

  if (nuevoCosto === "" || nuevasUnidades === "") {
    setMessage(updateProductMessage, "Ingresa el nuevo costo y las nuevas unidades.", "warning");
    return;
  }

  const payload = {
    nombre_producto: nombreProducto,
    nuevo_costo: Number(nuevoCosto),
    nuevas_unidades: Number(nuevasUnidades),
  };

  try {
    setMessage(updateProductMessage, "Actualizando producto...", "info");
    const res = await fetch(`${API_BASE}/api/productos/actualizar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      const msg = data.mensaje || data.error || "No se pudo actualizar el producto.";
      setMessage(updateProductMessage, msg, "error");
      return;
    }

    setMessage(updateProductMessage, "Producto actualizado correctamente.", "success");
    addNotification(`Producto "${nombreProducto}" actualizado.`, "success");
    // Recargar inventario para reflejar cambios
    loadInventory();
  } catch (err) {
    console.error(err);
    setMessage(updateProductMessage, "Error al actualizar el producto.", "error");
  }
}

// =======================
// Cambiar estado pedido
// =======================
async function handleChangeStatusSubmit(ev) {
  ev.preventDefault();

  const pedidoId = pedidoIdEstadoInput.value;
  const nuevoEstado = nuevoEstadoSelect.value;

  if (!pedidoId || !nuevoEstado) {
    setMessage(changeStatusMessage, "Debes llenar todos los campos.", "warning");
    return;
  }

  const payload = {
    pedido_id: Number(pedidoId),
    nuevo_estado: String(nuevoEstado),
  };

  try {
    setMessage(changeStatusMessage, "Actualizando estado del pedido...", "info");
    const res = await fetch(`${API_BASE}/api/pedidos/cambiar-estado`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      const msg = data.mensaje || data.error || "No se pudo cambiar el estado.";
      setMessage(changeStatusMessage, msg, "error");
      addNotification(`Error al cambiar estado del pedido #${pedidoId}: ${msg}`, "error");
      return;
    }

    const pedido = data.pedido || {};
    const estado = pedido.estado || nuevoEstado;

    setMessage(
      changeStatusMessage,
      `Estado actualizado correctamente. Pedido #${pedidoId} ahora está en "${estado}".`,
      "success"
    );
    addNotification(`Pedido #${pedidoId} actualizado a "${estado}".`, "success");
  } catch (err) {
    console.error(err);
    setMessage(changeStatusMessage, "Error al cambiar estado del pedido.", "error");
  }
}

// =======================
// Resumen de pedido
// =======================
async function handleResumenSubmit(ev) {
  ev.preventDefault();

  const pedidoId = pedidoIdResumenInput.value;
  if (!pedidoId) {
    setMessage(resumenMessage, "Ingresa un ID de pedido.", "warning");
    return;
  }

  const payload = {
    pedido_id: Number(pedidoId),
  };

  try {
    setMessage(resumenMessage, "Consultando resumen...", "info");
    resumenTableWrapper.classList.add("d-none");
    resumenTableBody.innerHTML = "";

    const res = await fetch(`${API_BASE}/api/pedidos/resumen`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      const msg = data.mensaje || data.error || "No se encontró el pedido.";
      setMessage(resumenMessage, msg, "error");
      return;
    }

    const r = data.resumen;
    resumenTableBody.innerHTML = "";

    const tr = document.createElement("tr");
    const tdId = document.createElement("td");
    tdId.textContent = r.pedido_id;

    const tdCliente = document.createElement("td");
    tdCliente.textContent = r.cliente_nombre;

    const tdTel = document.createElement("td");
    tdTel.textContent = r.telefono_cliente;

    const tdTotal = document.createElement("td");
    tdTotal.textContent = formatCurrency(r.costo_total);

    const tdEstado = document.createElement("td");
    tdEstado.textContent = r.estado_pedido;

    tr.appendChild(tdId);
    tr.appendChild(tdCliente);
    tr.appendChild(tdTel);
    tr.appendChild(tdTotal);
    tr.appendChild(tdEstado);

    resumenTableBody.appendChild(tr);
    resumenTableWrapper.classList.remove("d-none");

    setMessage(resumenMessage, "Resumen cargado correctamente.", "success");
  } catch (err) {
    console.error(err);
    setMessage(resumenMessage, "Error al obtener el resumen del pedido.", "error");
  }
}

// =======================
// Últimos 10 pedidos (Polling)
// =======================
async function loadLastOrders(isFromPolling = false) {
  try {
    if (!isFromPolling) {
      setMessage(lastOrdersMessage, "Cargando últimos pedidos...", "info");
    }

    const res = await fetch(`${API_BASE}/api/pedidos/ultimos10`);
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }
    const data = await res.json();
    if (!data.ok) {
      throw new Error("La API devolvió ok=false");
    }

    const pedidos = data.pedidos || [];
    lastOrdersTableBody.innerHTML = "";

    const newSnapshot = new Map();

    pedidos.forEach((p) => {
      const tr = document.createElement("tr");
      tr.dataset.pedidoId = p.pedido_id;

      const tdId = document.createElement("td");
      tdId.textContent = p.pedido_id;

      const tdCliente = document.createElement("td");
      tdCliente.textContent = p.cliente_nombre;

      const tdCosto = document.createElement("td");
      tdCosto.textContent = formatCurrency(p.costo_total);

      const tdEstado = document.createElement("td");
      tdEstado.textContent = p.estado;

      const tdFecha = document.createElement("td");
      tdFecha.textContent = formatDateLabel(p.fecha_pedido);

      tr.appendChild(tdId);
      tr.appendChild(tdCliente);
      tr.appendChild(tdCosto);
      tr.appendChild(tdEstado);
      tr.appendChild(tdFecha);

      lastOrdersTableBody.appendChild(tr);

      newSnapshot.set(p.pedido_id, {
        estado: p.estado,
        costo_total: String(p.costo_total),
        cliente_nombre: p.cliente_nombre,
      });
    });

    // Detectar cambios para notificaciones
    if (lastOrdersSnapshot.size > 0) {
      newSnapshot.forEach((val, id) => {
        const old = lastOrdersSnapshot.get(id);
        if (!old) {
          // Nuevo pedido
          addNotification(
            `Nuevo pedido #${id} de ${val.cliente_nombre} (estado: ${val.estado}, total: $${val.costo_total}).`,
            "success"
          );
          highlightRow(id);
        } else {
          // Cambios de estado o total
          if (old.estado !== val.estado || old.costo_total !== val.costo_total) {
            const changes = [];
            if (old.estado !== val.estado) {
              changes.push(`estado: ${old.estado} → ${val.estado}`);
            }
            if (old.costo_total !== val.costo_total) {
              changes.push(`total: $${old.costo_total} → $${val.costo_total}`);
            }
            addNotification(`Pedido #${id} actualizado (${changes.join(", ")}).`, "warning");
            highlightRow(id);
          }
        }
      });
    }

    lastOrdersSnapshot = newSnapshot;

    const now = new Date();
    lastUpdateLabel.textContent = `Última actualización: ${now.toLocaleTimeString()}`;
    if (!isFromPolling) {
      setMessage(lastOrdersMessage, "", "info");
    } else {
      setMessage(lastOrdersMessage, "", "info");
    }
  } catch (err) {
    console.error(err);
    setMessage(lastOrdersMessage, "Error al cargar los últimos pedidos.", "error");
  }
}

function highlightRow(pedidoId) {
  const rows = lastOrdersTableBody.querySelectorAll("tr");
  rows.forEach((row) => {
    if (Number(row.dataset.pedidoId) === Number(pedidoId)) {
      row.classList.add("row-highlight");
      setTimeout(() => {
        row.classList.remove("row-highlight");
      }, 1200);
    }
  });
}

// =======================
// Inicialización
// =======================
document.addEventListener("DOMContentLoaded", () => {
  // Cargar datos iniciales
  loadInventory();
  loadLastOrders(false);

  // Botón recargar inventario
  if (btnReloadInventory) {
    btnReloadInventory.addEventListener("click", () => {
      loadInventory();
    });
  }

  // Formularios
  if (updateProductForm) {
    updateProductForm.addEventListener("submit", handleUpdateProductSubmit);
  }

  if (changeStatusForm) {
    changeStatusForm.addEventListener("submit", handleChangeStatusSubmit);
  }

  if (resumenForm) {
    resumenForm.addEventListener("submit", handleResumenSubmit);
  }

  // Polling cada 2 segundos
  setInterval(() => {
    loadLastOrders(true);
  }, 2000);
});
