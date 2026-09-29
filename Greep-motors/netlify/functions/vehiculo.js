const { google } = require('googleapis');

exports.handler = async function(event, context) {
    // Validar que existan parámetros de consulta
    if (!event.queryStringParameters || !event.queryStringParameters.placa) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Falta el parámetro 'placa'" })
        };
    }

    const placaBuscada = event.queryStringParameters.placa.trim().toUpperCase();

    try {
        // Autenticación con Google Sheets usando variables de entorno de Netlify
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                // Manejo seguro de saltos de línea en la llave privada
                private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID; // El ID de tu hoja de cálculo Taller_BD

        if (!spreadsheetId) {
            console.error("Falta la variable de entorno GOOGLE_SHEET_ID");
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Configuración del servidor incompleta (GOOGLE_SHEET_ID)" })
            };
        }

        // Leer los datos de la hoja (asegúrate de que la pestaña activa o la primera contenga los datos en A:G)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A:G', // Tus columnas van de la A a la G
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            console.log("La hoja de cálculo está vacía o solo tiene encabezados.");
            return { 
                statusCode: 200, 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([]) 
            };
        }

        const headers = rows[0]; // Encabezados: Foto, Modelo_Veiculo, Placas_Veiculo, Fecha_entrega, Kilometraje_actual, Estatus, Descripcion_Servicio
        const dataRows = rows.slice(1);

        // Mapear y buscar la fila que coincida exactamente con la placa buscada
        const vehiculoEncontrado = dataRows
            .map(row => {
                let obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] !== undefined ? row[index] : "";
                });
                return obj;
            })
            .filter(auto => {
                if (!auto.Placas_Veiculo) return false;
                const placaExcel = auto.Placas_Veiculo.toString().trim().toUpperCase();
                return placaExcel === placaBuscada;
            });

        console.log(`Búsqueda de placa [${placaBuscada}] - Encontrados: ${vehiculoEncontrado.length}`);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(vehiculoEncontrado),
        };

    } catch (error) {
        console.error("Error crítico al conectar con Google Sheets:", error.message);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Error interno al consultar la base de datos", detalle: error.message })
        };
    }
};
