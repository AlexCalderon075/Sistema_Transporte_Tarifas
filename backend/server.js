const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs'); // Nuevo: para asegurar que existan las carpetas

const app = express();
// CAMBIO 1: Puerto dinámico para Render
const PORT = process.env.PORT || 3000;

// --- CONFIGURACIÓN ---
app.use(cors());
app.use(express.json());

// CAMBIO 2: Asegurar que existan las carpetas de uploads y database al arrancar
// Esto evita errores en Render si las carpetas no se subieron a GitHub
const uploadsDir = path.join(__dirname, 'uploads');
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

// CAMBIO 3: Servir archivos estáticos del frontend
// Como el server está en /backend, usamos '../frontend'
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(uploadsDir));

// --- CONFIGURACIÓN DE ALMACENAMIENTO DE FOTOS ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- CONEXIÓN BASE DE DATOS ---
// CAMBIO 4: Ruta absoluta para la base de datos
const dbPath = path.join(dbDir, 'tarifas.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error("Error al abrir DB:", err.message);
    console.log("Conectado a SQLite exitosamente.");
});

// --- TABLAS (Igual que antes) ---
db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT, telefono TEXT, correo TEXT UNIQUE,
    tarjeta_id TEXT, password TEXT, foto TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS historial_calculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT, origen TEXT, destino TEXT, unidad TEXT, 
    tipo_viaje TEXT, tipo_caja TEXT, km REAL, peso REAL, 
    costo_operativo REAL, utilidad REAL, tarifa_final REAL, 
    usuario_nombre TEXT, dias_viaje INTEGER, costo_recoleccion REAL, 
    con_transfer TEXT, moneda TEXT, tipo_operacion TEXT, 
    monto_casetas REAL, precio_diesel REAL, rendimiento REAL, 
    porcentaje_utilidad REAL, tarjeta_operador TEXT,
    carga_laboral REAL, mantenimiento REAL, llantas REAL, 
    seguro_tracto REAL, seguro_caja REAL, depreciacion REAL, 
    rastreo_satelital REAL, diversos_trans REAL, 
    administracion REAL, infraestructura REAL, direccion_ogoi REAL
)`);

// --- RUTAS API (Sin cambios necesarios) ---

app.post('/api/historial', (req, res) => {
    const d = req.body;
    const sql = `INSERT INTO historial_calculos (
        fecha, origen, destino, unidad, tipo_viaje, tipo_caja, km, peso,
        costo_operativo, utilidad, tarifa_final, usuario_nombre,
        dias_viaje, costo_recoleccion, con_transfer, moneda,
        tipo_operacion, monto_casetas, precio_diesel, rendimiento,
        porcentaje_utilidad, tarjeta_operador, carga_laboral, mantenimiento,
        llantas, seguro_tracto, seguro_caja, depreciacion, rastreo_satelital,
        diversos_trans, administracion, infraestructura, direccion_ogoi
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const params = [
        d.fecha, d.origen, d.destino, d.unidad, d.tipo_viaje, d.tipo_caja, d.km, d.peso,
        d.costo_operativo, d.utilidad, d.tarifa_final, d.usuario_nombre,
        d.dias_viaje, d.costo_recoleccion, d.con_transfer, d.moneda,
        d.tipo_operacion, d.monto_casetas, d.precio_diesel, d.rendimiento,
        d.porcentaje_utilidad, d.tarjeta_operador, d.carga_laboral, d.mantenimiento,
        d.llantas, d.seguro_tracto, d.seguro_caja, d.depreciacion, d.rastreo_satelital,
        d.diversos_trans, d.administracion, d.infraestructura, d.direccion_ogoi
    ];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: "Cotización guardada", id: this.lastID });
    });
});

app.post('/api/registro', (req, res) => {
    const { nombre, telefono, correo, tarjeta_id, password } = req.body;
    const sql = `INSERT INTO usuarios (nombre, telefono, correo, tarjeta_id, password) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [nombre, telefono, correo, tarjeta_id, password], function(err) {
        if (err) return res.status(400).json({ error: "Error al registrar" });
        res.json({ mensaje: "Usuario creado", id: this.lastID });
    });
});

app.post('/api/login', (req, res) => {
    const { correo, password } = req.body;
    db.get(`SELECT * FROM usuarios WHERE correo = ? AND password = ?`, [correo, password], (err, row) => {
        if (row) res.json({ mensaje: "Entrando...", usuario: row });
        else res.status(401).json({ error: "Credenciales incorrectas" });
    });
});

app.get('/api/usuario/:nombre', (req, res) => {
    const nombre = req.params.nombre;
    db.get(`SELECT nombre, correo, telefono, tarjeta_id, foto FROM usuarios WHERE nombre = ?`, [nombre], (err, row) => {
        if (row) res.json(row);
        else res.status(404).json({ error: "No encontrado" });
    });
});

app.put('/api/usuario/actualizar/:nombreOriginal', upload.single('fotoArchivo'), (req, res) => {
    const { nombre, telefono, tarjeta_id } = req.body;
    const { nombreOriginal } = req.params;
    let fotoRuta = req.file ? `/uploads/${req.file.filename}` : req.body.fotoExistente;

    const sql = `UPDATE usuarios SET nombre = ?, telefono = ?, tarjeta_id = ?, foto = ? WHERE nombre = ?`;
    db.run(sql, [nombre, telefono, tarjeta_id, fotoRuta, nombreOriginal], function(err) {
        if (err) return res.status(500).json({ error: "Error al actualizar" });
        res.json({ mensaje: "Perfil actualizado", foto: fotoRuta });
    });
});

app.get('/api/historial', (req, res) => {
    const sql = `SELECT * FROM historial_calculos ORDER BY id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CAMBIO 5: Ajuste de mensaje de log para Render
app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});