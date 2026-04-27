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
app.post('/api/historial', async (req, res) => {
    const d = req.body;
    const sql = `INSERT INTO historial_calculos (
        fecha, origen, destino, unidad, tipo_viaje, tipo_caja, km, 
        costo_operativo, utilidad, tarifa_final, usuario_nombre,
        dias_viaje, costo_recoleccion, con_transfer, moneda
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`;

    const params = [
        d.fecha, d.origen, d.destino, d.unidad, d.tipo_viaje, d.tipo_caja, d.km,
        d.costo_operativo, d.utilidad, d.tarifa_final, d.usuario_nombre,
        d.dias_viaje, d.costo_recoleccion, d.con_transfer, d.moneda
    ];

    try {
        await pool.query(sql, params);
        res.json({ mensaje: "Cotización guardada" });
    } catch (err) {
        console.error("Error guardando historial:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Comodín para SPA (Single Page Application)
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`SERVIDOR V4 - RUTAS SINCRONIZADAS - PUERTO ${PORT}`);
});