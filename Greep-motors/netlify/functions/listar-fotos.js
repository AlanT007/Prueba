const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    const placa = event.queryStringParameters && event.queryStringParameters.placa;
    
    if (!placa) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Falta la placa" })
        };
    }

    const placaLimpia = placa.trim().toUpperCase();
    // Ruta hacia la carpeta de la placa en el servidor
    const carpetaPlaca = path.join(__dirname, '../../public/Imagenes', placaLimpia);

    try {
        if (!fs.existsSync(carpetaPlaca)) {
            return {
                statusCode: 200,
                body: JSON.stringify([]) // Si la carpeta no existe aún, regresa lista vacía
            };
        }

        // Lee todos los archivos reales que hay dentro de la carpeta de la placa
        const archivos = fs.readdirSync(carpetaPlaca);
        
        // Filtra solo archivos de imagen válidos
        const imagenesValidas = archivos.filter(archivo => {
            const ext = path.extname(archivo).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG'].includes(ext);
        });

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(imagenesValidas)
        };
    } catch (error) {
        console.error("Error al escanear carpeta:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error al escanear el directorio" })
        };
    }
};
