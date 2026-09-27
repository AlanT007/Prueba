exports.handler = async function(event, context) {
    // Obtenemos la placa que manda el cliente por la URL (ej: ?placa=ABC123)
    const placa = event.queryStringParameters ? event.queryStringParameters.placa : null;

    if (!placa) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Falta el código de placa" }),
        };
    }

    // Leemos la variable secreta de Netlify
    const SHEETDB_API_URL = process.env.SHEETDB_API_URL;

    if (!SHEETDB_API_URL) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "La variable SHEETDB_API_URL no está configurada en Netlify" }),
        };
    }

    try {
        // Usamos fetch nativo (disponible en Netlify Functions)
        const url = `${SHEETDB_API_URL}/search?Placas=${encodeURIComponent(placa)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error en la respuesta de SheetDB: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: "Error al conectar con la base de datos", 
                detalle: error.message 
            }),
        };
    }
};
