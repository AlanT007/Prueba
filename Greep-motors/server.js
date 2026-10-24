const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SHEETDB_API_URL = process.env.SHEETDB_API_URL;

// Servir archivos estáticos (tu HTML, CSS, JS del cliente)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta protegida en el backend para consultar el vehículo por placa
app.get('/api/vehiculo/:placa', async (req, res) => {
    const placaBusqueda = req.params.placa;

    if (!placaBusqueda) {
        return res.status(400).json({ error: "Falta el código de placa" });
    }

    try {
        // CORREGIDO: Se usa 'Placas_Veiculo' para coincidir con la columna exacta del Excel/Google Sheets
        const response = await fetch(`${SHEETDB_API_URL}/search?Placas_Veiculo=${encodeURIComponent(placaBusqueda)}`);
        const data = await response.json();
        
        // Retornamos los datos limpios al frontend sin exponer la URL de SheetDB
        res.json(data);
    } catch (error) {
        console.error("Error al conectar con SheetDB:", error);
        res.status(500).json({ error: "Error de conexión con la base de datos" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor seguro corriendo en http://localhost:${PORT}`);
});
