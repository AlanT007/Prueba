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

// 1. Generar Código QR
try {
    const paginaActual = window.location.href;
    if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(paginaActual)}`;
    }
} catch (e) {
    console.error("Error al generar QR:", e);
}

// 2. Validar Parámetro de Placa
if (!placaBusqueda) {
    if (spanPlaca) spanPlaca.textContent = "No especificada";
    if (spanModelo) spanModelo.textContent = "---";
    if (spanKilometraje) spanKilometraje.textContent = "---";
    if (spanFecha) spanFecha.textContent = "---";
    if (spanDescripcion) spanDescripcion.textContent = "---";
    if (spanEstatus) {
        spanEstatus.textContent = "Falta código de placa";
        spanEstatus.classList.remove('loading');
    }
    if (imgText) {
        imgText.textContent = "Sin placa en URL";
        imgText.classList.remove('loading');
    }
} else {
    const placaLimpia = placaBusqueda.trim().toUpperCase();
    if (spanPlaca) spanPlaca.textContent = placaLimpia;

    fetch(`/.netlify/functions/vehiculo?placa=${encodeURIComponent(placaLimpia)}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP Error status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data && Array.isArray(data) && data.length > 0) {
                const auto = data[0];

                if (spanModelo) spanModelo.textContent = auto.Modelo_Veiculo || "No registrado";
                if (spanKilometraje) spanKilometraje.textContent = auto.Kilometraje_actual ? `${auto.Kilometraje_actual} km` : "No registrado";
                if (spanFecha) spanFecha.textContent = auto.Fecha_entrega || "Por definir";
                if (spanDescripcion) spanDescripcion.textContent = auto.Descripcion_Servicio || "Sin observaciones";
                if (spanEstatus) {
                    spanEstatus.textContent = auto.Estatus || "Sin estatus";
                    spanEstatus.classList.remove('loading');
                }

                // --- MANEJO SEGURO DE LA FOTO ---
                const fotoRaw = auto.Foto || auto.foto || auto.Imagen || auto.URL || auto.Foto_Veiculo || "";
                const fotoValor = String(fotoRaw).trim();

                if (fotoValor !== "" && fotoValor !== "null" && fotoValor !== "undefined" && fotoValor !== "Archivo") {
                    let rutaFinal = "";

                    // Limpiar imágenes previas
                    const imgExistente = imgContainer.querySelector('img');
                    if (imgExistente) imgExistente.remove();

                    // CASO A: Enlace de Google Drive
                    if (fotoValor.includes('drive.google.com')) {
                        const match = fotoValor.match(/\/d\/([^\/]+)/) || fotoValor.match(/id=([^&]+)/);
                        if (match && match[1]) {
                            rutaFinal = `https://lh3.googleusercontent.com/d/${match[1]}`;
                        } else {
                            rutaFinal = fotoValor;
                        }
                    } 
                    // CASO B: Enlace web directo (http/https)
                    else if (fotoValor.startsWith('http://') || fotoValor.startsWith('https://')) {
                        rutaFinal = fotoValor;
                    } 
                    // CASO C: Imagen guardada en servidor local (saliendo de la carpeta public con ../)
                    else {
                        const nombreArchivo = fotoValor.split('/').pop().split('\\').pop();
                        rutaFinal = `../Imágenes/${nombreArchivo}`;
                    }

                    // Insertar imagen
                    imgText.style.display = "none";
                    const imgElement = document.createElement('img');
                    imgElement.src = rutaFinal;
                    imgElement.alt = "Foto del Vehículo";

                    // Fallback de seguridad por si busca en minúsculas saliendo de public
                    imgElement.onerror = function() {
                        if (this.src.includes('../Imágenes/')) {
                            this.src = this.src.replace('../Imágenes/', '../imagenes/');
                            return;
                        }

                        this.remove();
                        imgText.style.display = "block";
                        imgText.style.fontSize = "0.75rem";
                        const soloNombre = fotoValor.split('/').pop().split('\\').pop();
                        imgText.textContent = `No se encontró la imagen: "${soloNombre}"`;
                        imgText.classList.remove('loading');
                    };

                    imgContainer.insertBefore(imgElement, imgContainer.firstChild);
                } else {
                    imgText.style.display = "block";
                    imgText.textContent = "Sin foto registrada";
                    imgText.classList.remove('loading');
                }

            } else {
                if (spanModelo) spanModelo.textContent = "No encontrado";
                if (spanEstatus) {
                    spanEstatus.textContent = "Vehículo no registrado";
                    spanEstatus.classList.remove('loading');
                }
                if (imgText) {
                    imgText.style.display = "block";
                    imgText.textContent = "Vehículo no encontrado";
                    imgText.classList.remove('loading');
                }
            }
        })
        .catch(error => {
            console.error("Error en la ejecución:", error);
            if (spanModelo) spanModelo.textContent = "Error";
            if (spanEstatus) {
                spanEstatus.textContent = "Error de conexión";
                spanEstatus.classList.remove('loading');
            }
            if (imgText) {
                imgText.style.display = "block";
                imgText.style.fontSize = "0.75rem";
                imgText.textContent = `Error: ${error.message}`;
                imgText.classList.remove('loading');
            }
        });
}
