const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs'); // Nuevo: para asegurar que las carpetas existan

const app = express();
// CAMBIO 1: Render asigna el puerto automáticamente mediante process.env.PORT
const PORT = process.env.PORT || 3000;

// --- CONFIGURACIÓN ---
app.use(cors());
app.use(express.json());

// CAMBIO 2: Asegurar que las carpetas de datos y subidas existan en el servidor
const uploadDir = path.join(__dirname, 'uploads');
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

// CAMBIO 3: Ajuste de rutas estáticas (Render suele usar una estructura plana o específica)
// Si tu carpeta de frontend está al mismo nivel que server.js, usa './frontend'
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});
app.use('/uploads', express.static(uploadDir));

// --- CONFIGURACIÓN DE ALMACENAMIENTO DE FOTOS ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- CONEXIÓN BASE DE DATOS ---
// CAMBIO 4: Ruta de la base de datos (Importante para el "Disk" de Render si lo usas)
const dbPath = path.join(dbDir, 'tarifas.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error("Error al abrir DB:", err.message);
    console.log("Conectado a SQLite exitosamente.");
});

// Inicialización de tablas (Tu código original se mantiene)
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        telefono TEXT,
        correo TEXT UNIQUE,
        tarjeta_id TEXT,
        password TEXT,
        foto TEXT
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
});

// --- RUTAS API ---

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
    const nombreUsuario = req.query.usuario; 
    if (!nombreUsuario) return res.status(400).json({ error: "Falta usuario." });

    const sql = `SELECT * FROM historial_calculos WHERE usuario_nombre = ? ORDER BY id DESC`;
    db.all(sql, [nombreUsuario], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CAMBIO 5: Middleware de Cache y Manejo de rutas de Frontend (SPA)
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// Esto asegura que si refrescas la página en una ruta que no existe, te mande al index
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// CAMBIO 6: Host 0.0.0.0 es necesario para que Render pueda acceder al servicio
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});