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

// Elementos del Carrusel Inferior
const carouselTrack = document.getElementById('carousel-track');
const carouselText = document.getElementById('carousel-text');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const dotsContainer = document.getElementById('carousel-dots');
const qrImg = document.getElementById('qr-img');

let currentIndex = 0;
let totalSlides = 0;

// Soporte de gestos táctiles (Swipe) para Móviles/Tablets
let touchStartX = 0;
let touchEndX = 0;

function handleTouchGesture(container) {
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    }, {passive: true});
}

function handleSwipeGesture() {
    const threshold = 50; 
    if (touchEndX < touchStartX - threshold) {
        currentIndex = (currentIndex < totalSlides - 1) ? currentIndex + 1 : 0;
        updateCarousel();
    }
    if (touchEndX > touchStartX + threshold) {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : totalSlides - 1;
        updateCarousel();
    }
}

// 1. Generar Código QR
try {
    const paginaActual = window.location.href;
    if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(paginaActual)}`;
    }
} catch (e) {
    console.error("Error al generar QR:", e);
}

// 2. Lógica del Carrusel Inferior
function updateCarousel() {
    if (totalSlides === 0) return;
    carouselTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
    });
}

function setupCarouselEvents() {
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : totalSlides - 1;
            updateCarousel();
        });
        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex < totalSlides - 1) ? currentIndex + 1 : 0;
            updateCarousel();
        });
    }

    const carouselContainerEl = document.getElementById('carousel-container');
    if (carouselContainerEl) {
        handleTouchGesture(carouselContainerEl);
    }
}

function processImageUrl(rawUrl, placaLimpia) {
    const fotoValor = String(rawUrl).trim();
    if (!fotoValor || fotoValor === "null" || fotoValor === "undefined" || fotoValor === "Archivo") return null;

    if (fotoValor.includes('drive.google.com')) {
        const match = fotoValor.match(/\/d\/([^\/]+)/) || fotoValor.match(/id=([^&]+)/);
        return match && match[1] ? `https://lh3.googleusercontent.com/d/${match[1]}` : fotoValor;
    } else if (fotoValor.startsWith('http://') || fotoValor.startsWith('https://')) {
        return fotoValor;
    } else {
        const nombreArchivo = fotoValor.split('/').pop().split('\\').pop();
        // Ruta corregida con I mayúscula
        return `./Imagenes/${placaLimpia}/${nombreArchivo}`;
    }
}

// =========================================================================
// FOTO PRINCIPAL DE ARRIBA (CONECTADA A GOOGLE SHEETS - 100% INTACTA)
// =========================================================================
function renderMainPhoto(fotoRaw, placaLimpia) {
    const fotoValor = String(fotoRaw).trim();
    const imgExistente = imgContainer.querySelector('img');
    if (imgExistente) imgExistente.remove();

    if (fotoValor !== "" && fotoValor !== "null" && fotoValor !== "undefined" && fotoValor !== "Archivo") {
        let rutaFinal = processImageUrl(fotoValor, placaLimpia);

        imgText.style.display = "none";
        const imgElement = document.createElement('img');
        imgElement.src = rutaFinal;
        imgElement.alt = "Foto del Vehículo";

        imgElement.onerror = function() {
            if (this.src.includes(`/${placaLimpia}/`)) {
                this.src = this.src.replace(`/${placaLimpia}/`, '/');
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
}

// =========================================================================
// CARRUSEL DINÁMICO INFERIOR (Apunta a ./Imagenes/[placa]/ con auto-corrector)
// =========================================================================
function renderCarouselDesdeSheet(fotosAvanceRaw, placaLimpia) {
    carouselTrack.innerHTML = '';
    dotsContainer.innerHTML = '';

    let listaFotos = [];
    if (fotosAvanceRaw) {
        if (Array.isArray(fotosAvanceRaw)) {
            listaFotos = fotosAvanceRaw;
        } else {
            listaFotos = String(fotosAvanceRaw).split(',').map(f => f.trim()).filter(f => f !== "");
        }
    }

    if (listaFotos.length === 0) {
        if (carouselText) {
            carouselText.style.display = "block";
            carouselText.textContent = "Aún no hay fotos de avance para esta placa";
            carouselText.classList.remove('loading');
        } else {
            carouselTrack.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #86868b; font-size: 0.9rem; font-family: var(--font-family);">Aún no hay fotos de avance para esta placa</div>`;
        }
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return;
    }

    if (carouselText) carouselText.style.display = "none";
    totalSlides = listaFotos.length;
    currentIndex = 0;

    listaFotos.forEach((nombreArchivo, idx) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';

        const img = document.createElement('img');
        // Ruta exacta apuntando a la carpeta de la placa con I mayúscula: ./Imagenes/[placa]/[nombre]
        img.src = `/Imagenes/${placaLimpia}/${encodeURIComponent(nombreArchivo)}`;
        img.alt = `Prueba de avance ${idx + 1}`;

        // Auto-corrector inteligente si hay discrepancias entre .jpg y .jpeg
        let intentoAlternativo = 0;
        img.onerror = function() {
            if (intentoAlternativo === 0) {
                intentoAlternativo = 1;
                if (this.src.endsWith('.jpg')) {
                    this.src = this.src.replace(/\.jpg$/i, '.jpeg');
                    return;
                } else if (this.src.endsWith('.jpeg')) {
                    this.src = this.src.replace(/\.jpeg$/i, '.jpg');
                    return;
                } else if (this.src.endsWith('.JPG')) {
                    this.src = this.src.replace(/\.JPG$/, '.JPEG');
                    return;
                }
            }
            this.style.opacity = '0.3';
        };

        slide.appendChild(img);
        carouselTrack.appendChild(slide);

        const dot = document.createElement('span');
        dot.className = `dot ${idx === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            currentIndex = idx;
            updateCarousel();
        });
        dotsContainer.appendChild(dot);
    });

    if (totalSlides > 1) {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    } else {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }

    updateCarousel();
}

// 3. Validar Parámetro de Placa y Cargar Datos
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
    if (carouselText) {
        carouselText.textContent = "Sin placa en URL";
        carouselText.classList.remove('loading');
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

                // 1. Foto principal de arriba (extraída de Google Sheets - INTACTA)
                const fotoPrincipal = auto.Foto || auto.foto || auto.Imagen || auto.URL || auto.Foto_Veiculo || "";
                renderMainPhoto(fotoPrincipal, placaLimpia);

                // 2. Fotos del carrusel de abajo (leídas desde Google Sheets)
                const fotosAvanceDelSheet = auto.Fotos_Avance || auto.Avances || auto.Fotos || "";
                renderCarouselDesdeSheet(fotosAvanceDelSheet, placaLimpia);

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
                if (carouselText) {
                    carouselText.style.display = "block";
                    carouselText.textContent = "Vehículo no encontrado";
                    carouselText.classList.remove('loading');
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
            if (carouselText) {
                carouselText.style.display = "block";
                carouselText.style.fontSize = "0.75rem";
                carouselText.textContent = `Error: ${error.message}`;
                carouselText.classList.remove('loading');
            }
        });
}

setupCarouselEvents();
