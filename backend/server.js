const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// --- 1. CONEXIÓN A SUPABASE ---
const connectionString = "postgresql://postgres.pwqqatkoikeofloahbtz:Aarx7fgXDv6assee@aws-1-us-west-2.pooler.supabase.com:5432/postgres";

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } 
});

// --- 2. MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
// Asegúrate de que la carpeta se llame 'frontend' y esté al mismo nivel que 'backend'
app.use(express.static(path.join(__dirname, '../frontend')));

// --- 3. RUTAS DEL CATÁLOGO ---

// Obtener todo el catálogo
app.get('/api/catalogo', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM catalogo_tarifas ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ACTUALIZAR CONCEPTO (Compatible con catalogo.js)
// Cambiamos a PUT y usamos el ID en la URL para que coincida con el fetch
app.put('/api/catalogo/:id', async (req, res) => {
    const { id } = req.params;
    const { valor } = req.body;
    
    console.log(`Buscando actualizar ID: ${id} con valor: ${valor}`);

    try {
        const sql = `UPDATE catalogo_tarifas SET valor = $1 WHERE id = $2`;
        const result = await pool.query(sql, [valor, id]);
        
        if (result.rowCount > 0) {
            res.json({ mensaje: "Concepto actualizado con éxito" });
        } else {
            res.status(404).json({ error: "No se encontró el registro" });
        }
    } catch (err) {
        console.error("Error en update:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- 4. RUTAS DE USUARIOS ---

app.post('/api/login', async (req, res) => {
    const { correo, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE correo = $1 AND password = $2', [correo, password]);
        if (result.rows.length > 0) {
            res.json({ mensaje: "Entrando...", usuario: result.rows[0] });
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 5. RUTA HISTORIAL ---
app.post('/api/historial_calculo', async (req, res) => {
    try {
        const datos = req.body;
        console.log("Intentando insertar en historial_calculos...");

        const { data, error } = await supabase
            .from('historial_calculos') // Asegúrate que tenga la 's'
            .insert([datos]);

        if (error) {
            // ESTO ES CLAVE: Ver el error real en tu terminal
            console.error("DETALLE DEL ERROR DE SUPABASE:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: "Guardado correctamente" });
    } catch (err) {
        console.error("ERROR CRÍTICO:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});
// Comodín para SPA (Single Page Application)
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`SERVIDOR V4 - RUTAS SINCRONIZADAS - PUERTO ${PORT}`);
});