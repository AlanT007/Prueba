const urlParams = new URLSearchParams(window.location.search);
const placaBusqueda = urlParams.get('placa');

const spanPlaca = document.getElementById('placa');
const spanModelo = document.getElementById('modelo');
const spanKilometraje = document.getElementById('kilometraje');
const spanFecha = document.getElementById('fecha');
const spanDescripcion = document.getElementById('descripcion');
const spanEstatus = document.getElementById('estatus');
const imgContainer = document.getElementById('image-wrapper-container');
const imgText = document.getElementById('img-text');
const qrImg = document.getElementById('qr-img');

// Generar código QR dinámico apuntando a la URL actual de la página
const paginaActual = window.location.href;
qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(paginaActual)}`;

if (!placaBusqueda) {
    spanPlaca.textContent = "No especificada";
    spanModelo.textContent = "---";
    spanKilometraje.textContent = "---";
    spanFecha.textContent = "---";
    spanDescripcion.textContent = "---";
    spanEstatus.textContent = "Falta código de placa";
    spanEstatus.classList.remove('loading');
    imgText.textContent = "Sin placa en URL";
} else {
    // Normalizamos la placa de búsqueda a mayúsculas y sin espacios
    const placaLimpia = placaBusqueda.trim().toUpperCase();
    spanPlaca.textContent = placaLimpia;

    // Petición segura a la función serverless de Netlify
    fetch(`/.netlify/functions/vehiculo?placa=${encodeURIComponent(placaLimpia)}`)
        .then(response => response.json())
        .then(data => {
            // Validamos si llegó un arreglo válido y con elementos
            if (data && Array.isArray(data) && data.length > 0) {
                const auto = data[0];
                
                spanModelo.textContent = auto.Modelo_Veiculo || "No registrado";
                spanKilometraje.textContent = auto.Kilometraje_actual ? `${auto.Kilometraje_actual} km` : "No registrado";
                spanFecha.textContent = auto.Fecha_entrega || "Por definir";
                spanDescripcion.textContent = auto.Descripcion_Servicio || "Sin observaciones";
                spanEstatus.textContent = auto.Estatus || "Sin estatus";
                spanEstatus.classList.remove('loading');

                if (auto.Foto && auto.Foto.trim() !== "" && auto.Foto !== "Archivo") {
                    imgText.style.display = "none";
                    const imgElement = document.createElement('img');
                    imgElement.src = auto.Foto;
                    imgElement.alt = "Foto del Vehículo";
                    imgContainer.insertBefore(imgElement, imgContainer.firstChild);
                } else {
                    imgText.textContent = "Sin foto registrada";
                    imgText.classList.remove('loading');
                }

            } else {
                spanModelo.textContent = "No encontrado";
                spanKilometraje.textContent = "---";
                spanFecha.textContent = "---";
                spanDescripcion.textContent = "---";
                spanEstatus.textContent = "Vehículo no registrado";
                spanEstatus.classList.remove('loading');
                imgText.textContent = "Vehículo no encontrado";
                imgText.classList.remove('loading');
            }
        })
        .catch(error => {
            console.error("Error al conectar:", error);
            spanModelo.textContent = "Error de red";
            spanEstatus.textContent = "Error de conexión";
            spanEstatus.classList.remove('loading');
            imgText.textContent = "Error de carga";
            imgText.classList.remove('loading');
        });
}
