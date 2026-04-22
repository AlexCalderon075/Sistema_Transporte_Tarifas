const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// --- 1. CONEXIÓN A SUPABASE ---
const connectionString = "postgresql://postgres.pwqqatkoikeofloahbtz:Aarx7fgXDv6assee@aws-1-us-west-2.pooler.supabase.com:5432/postgres"

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } 
});

// --- 2. MIDDLEWARES ---
app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, uploadsDir); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// --- 3. INICIALIZACIÓN DE TABLAS (Catálogo en PostgreSQL) ---
// Esta función crea la tabla de catálogo si no existe en Supabase
const initDB = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS catalogo_tarifas (
            id SERIAL PRIMARY KEY,
            unidad TEXT UNIQUE,
            rendimiento REAL,
            precio_diesel REAL,
            infraestructura REAL,
            sueldo_operador REAL,
            administracion REAL,
            utilidad REAL
        )`);

        const res = await pool.query("SELECT COUNT(*) FROM catalogo_tarifas");
        if (parseInt(res.rows[0].count) === 0) {
            const sqlSeed = `INSERT INTO catalogo_tarifas 
                (unidad, rendimiento, precio_diesel, infraestructura, sueldo_operador, administracion, utilidad) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)`;
            await pool.query(sqlSeed, ['Sencillo T3-S2', 2.5, 24.10, 1500, 2000, 10, 15]);
            await pool.query(sqlSeed, ['Full T3-S2-S2', 1.8, 24.10, 2800, 3000, 10, 15]);
            console.log("🌱 Catálogo inicial creado en Supabase");
        }
    } catch (err) {
        console.error("❌ Error inicializando catálogo:", err.message);
    }
};
initDB();

// --- 4. RUTAS DEL CATÁLOGO (Corregidas para Supabase) ---

app.get('/api/catalogo', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM catalogo_tarifas ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/catalogo/update', async (req, res) => {
    const { id, rendimiento, precio_diesel, infraestructura, administracion, utilidad } = req.body;
    
    // AGREGA ESTO PARA VERLO EN RENDER
    console.log(`📝 Actualizando catálogo ID: ${id} - Nuevo Diesel: $${precio_diesel}`);

    const sql = `UPDATE catalogo_tarifas SET 
                 rendimiento = $1, precio_diesel = $2, infraestructura = $3, 
                 administracion = $4, utilidad = $5 
                 WHERE id = $6`;
    try {
        await pool.query(sql, [rendimiento, precio_diesel, infraestructura, administracion, utilidad, id]);
        console.log("✅ Cambio guardado en Supabase"); // Otro log útil
        res.json({ mensaje: "Catálogo actualizado con éxito" });
    } catch (err) {
        console.error("❌ Error en update:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- 5. OTRAS RUTAS (Usuarios e Historial - Mantener igual pero con Pool) ---

app.post('/api/registro', async (req, res) => {
    const { nombre, telefono, correo, tarjeta_id, password } = req.body;
    const sql = `INSERT INTO usuarios (nombre, telefono, correo, tarjeta_id, password) VALUES ($1, $2, $3, $4, $5)`;
    try {
        await pool.query(sql, [nombre, telefono, correo, tarjeta_id, password]);
        res.json({ mensaje: "Usuario creado exitosamente" });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: "El correo ya existe" });
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { correo, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE correo = $1 AND password = $2', [correo, password]);
        if (result.rows.length > 0) res.json({ mensaje: "Entrando...", usuario: result.rows[0] });
        else res.status(401).json({ error: "Credenciales incorrectas" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/historial', async (req, res) => {
    const d = req.body;
    const sql = `INSERT INTO historial_calculos (
        fecha, origen, destino, unidad, tipo_viaje, tipo_caja, km, 
        costo_operativo, utilidad, tarifa_final, usuario_nombre,
        dias_viaje, costo_recoleccion, con_transfer, moneda,
        tipo_operacion, monto_casetas, precio_diesel, rendimiento,
        porcentaje_utilidad, carga_laboral, mantenimiento,
        llantas, seguro_tracto, seguro_caja, depreciacion, rastreo_satelital,
        diversos_trans, administracion, infraestructura, direccion_ogoi
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)`;

    const params = [
        d.fecha, d.origen, d.destino, d.unidad, d.tipo_viaje, d.tipo_caja, d.km,
        d.costo_operativo, d.utilidad, d.tarifa_final, d.usuario_nombre,
        d.dias_viaje, d.costo_recoleccion, d.con_transfer, d.moneda,
        d.tipo_operacion, d.monto_casetas, d.precio_diesel, d.rendimiento,
        d.porcentaje_utilidad, d.carga_laboral, d.mantenimiento,
        d.llantas, d.seguro_tracto, d.seguro_caja, d.depreciacion, d.rastreo_satelital,
        d.diversos_trans, d.administracion, d.infraestructura, d.direccion_ogoi
    ];

    try {
        await pool.query(sql, params);
        res.json({ mensaje: "Cotización guardada" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta comodín para el frontend (al final)
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Supabase activo en puerto ${PORT}`);
});