exports.handler = async function(event, context) {
    // 1. Validar que venga el parámetro de la placa en la URL
    if (!event.queryStringParameters || !event.queryStringParameters.placa) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Falta el parámetro 'placa'" })
        };
    }

    const placaBuscada = event.queryStringParameters.placa.trim().toUpperCase();
    const sheetDbUrl = process.env.SHEETDB_API_URL;

    // 2. Validar que la variable de entorno de SheetDB exista
    if (!sheetDbUrl) {
        console.error("Falta la variable de entorno SHEETDB_API_URL");
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Configuración incompleta: falta SHEETDB_API_URL" })
        };
    }

    try {
        // 3. Consultar SheetDB filtrando por la columna de placas de tu Excel
        // Nota: Asegúrate de que en tu Google Sheet la columna se llame exactamente 'Placas_Veiculo'
        const urlBusqueda = `${sheetDbUrl}/search?Placas_Veiculo=${encodeURIComponent(placaBuscada)}`;
        
        const response = await fetch(urlBusqueda);
        const data = await response.json();

        console.log(`Búsqueda SheetDB [${placaBuscada}] - Resultados:`, JSON.stringify(data));

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error("Error al conectar con SheetDB:", error.message);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Error interno al consultar SheetDB", detalle: error.message })
        };
    }
};
