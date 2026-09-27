const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Obtenemos la placa que manda el cliente por la URL (ej: ?placa=ABC123)
    const placa = event.queryStringParameters.placa;

    if (!placa) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Falta el código de placa" }),
        };
    }

    // Leemos la variable secreta que guardaremos en Netlify
    const SHEETDB_API_URL = process.env.SHEETDB_API_URL;

    try {
        // Hacemos la petición a SheetDB de forma oculta al usuario
        const response = await fetch(`${SHEETDB_API_URL}/search?Placas=${encodeURIComponent(placa)}`);
        const data = await response.json();

        // Devolvemos el resultado al frontend
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
            body: JSON.stringify({ error: "Error al conectar con la base de datos" }),
        };
    }
};