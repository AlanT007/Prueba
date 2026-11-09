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
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : totalSlides - 1;
            updateCarousel();
        });
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
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
        return `./Imágenes/${placaLimpia}/${encodeURIComponent(nombreArchivo)}`;
    }
}

// Renderizar la foto principal normal (arriba)
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
            this.remove();
            imgText.style.display = "block";
            imgText.style.fontSize = "0.75rem";
            imgText.textContent = "Sin foto principal registrada";
            imgText.classList.remove('loading');
        };

        imgContainer.insertBefore(imgElement, imgContainer.firstChild);
    } else {
        imgText.style.display = "block";
        imgText.textContent = "Sin foto registrada";
        imgText.classList.remove('loading');
    }
}

// Renderizar carrusel buscando dinámicamente en la carpeta de la placa específica
function renderCarouselAutomatico(placaLimpia) {
    carouselTrack.innerHTML = '';
    dotsContainer.innerHTML = '';

    // Lista amplia de nombres comunes y patrones de cámara que puedes tener en tus carpetas de placas
    let candidatosArchivos = [
        'IMG_2460.JPG', 'IMG_2476.JPG', 'IMG_2482.JPG',
        'IMG_2460.jpg', 'IMG_2476.jpg', 'IMG_2482.jpg',
        'Imagen3.jpeg', 'Imagen4.jpeg', 'Imagen_Carro1.jpg',
        '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg',
        '1.JPG', '2.JPG', '3.JPG', '4.JPG', '5.JPG', '6.JPG', '7.JPG', '8.JPG',
        '1.jpeg', '2.jpeg', '3.jpeg', '4.jpeg',
        '1.png', '2.png', '3.png'
    ];

    // Incluir un rango adicional por si usas numeraciones extendidas
    for (let i = 2400; i <= 2500; i++) {
        candidatosArchivos.push(`IMG_${i}.JPG`);
        candidatosArchivos.push(`IMG_${i}.jpg`);
    }

    let imagenesValidasEncontradas = [];
    let verificacionesPendientes = candidatosArchivos.length;

    candidatosArchivos.forEach((nombreArchivo, indexIdentificador) => {
        // Apunta directamente a la carpeta de la placa: ./Imágenes/ABC-1234/foto.jpg
        const rutaSugerida = `./Imágenes/${placaLimpia}/${encodeURIComponent(nombreArchivo)}`;

        const imgTest = new Image();
        imgTest.src = rutaSugerida;
        
        imgTest.onload = function() {
            if (!imagenesValidasEncontradas.some(img => img.url === rutaSugerida)) {
                imagenesValidasEncontradas.push({ id: indexIdentificador, url: rutaSugerida });
            }
            procesarResultados();
        };

        imgTest.onerror = function() {
            procesarResultados();
        };
    });

    function procesarResultados() {
        verificacionesPendientes--;
        
        if (verificacionesPendientes <= 0) {
            imagenesValidasEncontradas.sort((a, b) => a.id - b.id);

            if (imagenesValidasEncontradas.length === 0) {
                carouselTrack.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #86868b; font-size: 0.9rem; font-family: var(--font-family);">Aún no hay fotos de avance para esta placa</div>`;
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
                return;
            }

            totalSlides = imagenesValidasEncontradas.length;
            currentIndex = 0;

            imagenesValidasEncontradas.forEach((item, idx) => {
                const slide = document.createElement('div');
                slide.className = 'carousel-slide';

                const img = document.createElement('img');
                img.src = item.url;
                img.alt = `Prueba de avance ${idx + 1}`;

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

            // Mostrar u ocultar flechas si hay más de una foto
            if (totalSlides > 1) {
                if (prevBtn) prevBtn.style.display = 'flex';
                if (nextBtn) nextBtn.style.display = 'flex';
            } else {
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
            }

            updateCarousel();
        }
    }
}

// 3. Validar Parámetro de Placa
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
    if (carouselTrack) {
        carouselTrack.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #86868b; font-size: 0.9rem;">Falta código de placa en la URL</div>`;
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

                const fotoPrincipal = auto.Foto || auto.foto || auto.Imagen || auto.URL || auto.Foto_Veiculo || "";
                renderMainPhoto(fotoPrincipal, placaLimpia);
                renderCarouselAutomatico(placaLimpia);

            } else {
                if (spanModelo) spanModelo.textContent = "No encontrado";
                if (spanEstatus) {
                    spanEstatus.textContent = "Vehículo no registrado";
                    spanEstatus.classList.remove('loading');
                }
                if (carouselTrack) {
                    carouselTrack.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #86868b; font-size: 0.9rem;">Vehículo no encontrado en el sistema</div>`;
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
            if (carouselTrack) {
                carouselTrack.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #86868b; font-size: 0.9rem;">Error de conexión con el servidor</div>`;
            }
        });
}

setupCarouselEvents();
