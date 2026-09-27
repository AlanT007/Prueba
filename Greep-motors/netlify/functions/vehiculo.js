exports.handler = async function(event, context) {
    const placa = event.queryStringParameters ? event.queryStringParameters.placa : null;

    if (!placa) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Falta el código de placa" }),
        };
    }

    const SHEETDB_API_URL = process.env.SHEETDB_API_URL;

    if (!SHEETDB_API_URL) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "La variable SHEETDB_API_URL no está configurada" }),
        };
    }

    try {
        // Probamos buscando de manera genérica o directo con el nombre exacto de la columna en la hoja
        const url = `${SHEETDB_API_URL}/search?Placas=${encodeURIComponent(placa)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error en SheetDB: ${response.statusText}`);
        }

        const data = await response.json();

        // Si la búsqueda estricta regresa vacío, intentamos traer todos los datos para depurar
        // (esto te ayudará a ver si SheetDB está leyendo la hoja correcta)
        if (data.length === 0) {
            const allResponse = await fetch(SHEETDB_API_URL);
            const allData = await allResponse.json();
            
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mensaje: "No se encontró coincidencia exacta con ?Placas=",
                    placaBuscada: placa,
                    registrosTotalesEnHoja: allData
                }, null, 2)
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data, null, 2),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error al conectar con la base de datos", detalle: error.message }),
        };
    }
};
