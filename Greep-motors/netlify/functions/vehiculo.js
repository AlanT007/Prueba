const { google } = require('googleapis');

exports.handler = async function(event, context) {
    const placaBuscada = event.queryStringParameters.placa;

    if (!placaBuscada) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Falta el parámetro 'placa'" })
        };
    }

    try {
        // Autenticación con Google Sheets usando variables de entorno de Netlify
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID; // El ID de tu hoja de cálculo Taller_BD

        // Leer los datos de la hoja (asumiendo que se llama "Hoja 1" o la primera pestaña)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A:G', // Tus columnas van de la A a la G
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            return { statusCode: 200, body: JSON.stringify([]) };
        }

        const headers = rows[0]; // Encabezados: Foto, Modelo_Veiculo, Placas_Veiculo, etc.
        const dataRows = rows.slice(1);

        // Buscar la fila que coincida con la placa buscada (Columna C -> índice 2)
        const vehiculoEncontrado = dataRows
            .map(row => {
                let obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || "";
                });
                return obj;
            })
            .filter(auto => auto.Placas_Veiculo && auto.Placas_Veiculo.trim().toUpperCase() === placaBuscada.trim().toUpperCase());

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(vehiculoEncontrado),
        };

    } catch (error) {
        console.error("Error al conectar con Google Sheets:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error interno al consultar la base de datos" })
        };
    }
};
