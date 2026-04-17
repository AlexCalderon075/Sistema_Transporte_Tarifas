const express = require('express');
const { Pool } = require('pg'); // Cambiamos sqlite3 por pg
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURACIÓN DE CONEXIÓN A SUPABASE ---
// REEMPLAZA ESTA URI con la que copiaste de Supabase (Connection String -> URI)
const connectionString = "postgresql://postgres:Aarx7fgXDv6assee@db.pwqqatkoikeofloahbtz.supabase.co:5432/postgres";

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } // Crucial para que Render conecte a Supabase
});

// --- CONFIGURACIÓN ---
app.use(cors());
app.use(express.json());

// Asegurar carpeta de fotos (aunque en Render se borrarán sin disco, la ruta debe existir)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, uploadsDir); },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- RUTAS API ---

// 1. Guardar Historial
app.post('/api/historial', async (req, res) => {
    const d = req.body;
    const sql = `INSERT INTO historial_calculos (
        fecha, origen, destino, unidad, tipo_viaje, tipo_caja, km, peso,
        costo_operativo, utilidad, tarifa_final, usuario_nombre,
        dias_viaje, costo_recoleccion, con_transfer, moneda,
        tipo_operacion, monto_casetas, precio_diesel, rendimiento,
        porcentaje_utilidad, tarjeta_operador, carga_laboral, mantenimiento,
        llantas, seguro_tracto, seguro_caja, depreciacion, rastreo_satelital,
        diversos_trans, administracion, infraestructura, direccion_ogoi
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33)`;

    const params = [
        d.fecha, d.origen, d.destino, d.unidad, d.tipo_viaje, d.tipo_caja, d.km, d.peso,
        d.costo_operativo, d.utilidad, d.tarifa_final, d.usuario_nombre,
        d.dias_viaje, d.costo_recoleccion, d.con_transfer, d.moneda,
        d.tipo_operacion, d.monto_casetas, d.precio_diesel, d.rendimiento,
        d.porcentaje_utilidad, d.tarjeta_operador, d.carga_laboral, d.mantenimiento,
        d.llantas, d.seguro_tracto, d.seguro_caja, d.depreciacion, d.rastreo_satelital,
        d.diversos_trans, d.administracion, d.infraestructura, d.direccion_ogoi
    ];

    try {
        await pool.query(sql, params);
        res.json({ mensaje: "Cotización guardada en Supabase" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Registro de Usuario
app.post('/api/registro', async (req, res) => {
    const { nombre, telefono, correo, tarjeta_id, password } = req.body;
    const sql = `INSERT INTO usuarios (nombre, telefono, correo, tarjeta_id, password) VALUES ($1, $2, $3, $4, $5)`;
    try {
        await pool.query(sql, [nombre, telefono, correo, tarjeta_id, password]);
        res.json({ mensaje: "Usuario creado exitosamente" });
    } catch (err) {
        res.status(400).json({ error: "Error al registrar (el correo podría ya existir)" });
    }
});

// 3. Login
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

// 4. Obtener Perfil
app.get('/api/usuario/:nombre', async (req, res) => {
    try {
        const result = await pool.query('SELECT nombre, correo, telefono, tarjeta_id, foto FROM usuarios WHERE nombre = $1', [req.params.nombre]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: "No encontrado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Actualizar Perfil
app.put('/api/usuario/actualizar/:nombreOriginal', upload.single('fotoArchivo'), async (req, res) => {
    const { nombre, telefono, tarjeta_id } = req.body;
    const { nombreOriginal } = req.params;
    let fotoRuta = req.file ? `/uploads/${req.file.filename}` : req.body.fotoExistente;

    const sql = `UPDATE usuarios SET nombre = $1, telefono = $2, tarjeta_id = $3, foto = $4 WHERE nombre = $5`;
    try {
        await pool.query(sql, [nombre, telefono, tarjeta_id, fotoRuta, nombreOriginal]);
        res.json({ mensaje: "Perfil actualizado", foto: fotoRuta });
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// 6. Obtener Historial
app.get('/api/historial', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM historial_calculos ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor PostgreSQL activo en puerto ${PORT}`);
});