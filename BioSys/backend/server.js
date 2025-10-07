const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require('google-auth-library');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');// 💳 NUEVO - Mercado Pago

dotenv.config();

// DEBUG TEMPORAL - MOVIDO AL LUGAR CORRECTO
console.log('=== DEBUG EMAIL CONFIG ===');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS definido:', !!process.env.EMAIL_PASS);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length);
console.log('EMAIL_PASS es string:', typeof process.env.EMAIL_PASS === 'string');
console.log('=============================');

const app = express();
const router = express.Router();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

// 💳 CONFIGURAR MERCADO PAGO - PRODUCCIÓN
console.log('🔍 MP_ACCESS_TOKEN configurado:', !!process.env.MP_ACCESS_TOKEN);
console.log('🔍 Primeros caracteres del token:', process.env.MP_ACCESS_TOKEN?.substring(0, 15));

const mercadopagoClient = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

if (!process.env.MP_ACCESS_TOKEN) {
  console.error('❌ ERROR: MP_ACCESS_TOKEN no está configurado en las variables de entorno');
  console.error('❌ Mercado Pago NO funcionará correctamente');
}


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "503963971592-17vo21di0tjf249341l4ocscemath5p0.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// 📧 RATE LIMITING PARA EMAILS
const emailRateLimit = new Map();

const checkEmailRateLimit = (email) => {
  const now = Date.now();
  const lastSent = emailRateLimit.get(email);
  
  if (lastSent && (now - lastSent) < 60000) {
    return false;
  }
  
  emailRateLimit.set(email, now);
  return true;
};

// 📧 CONFIGURACIÓN MEJORADA DE NODEMAILER
const crearTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  console.log('DEBUG: Verificando credenciales...');
  console.log('EMAIL_USER:', emailUser);
  console.log('EMAIL_PASS existe:', !!emailPass);
  console.log('EMAIL_PASS es string:', typeof emailPass === 'string');
  
  if (!emailUser || !emailPass) {
    console.error('ERROR: EMAIL_USER o EMAIL_PASS no definidos');
    return null;
  }
  
  if (emailUser === 'tu-email@gmail.com' || emailPass === 'tu-password-de-aplicacion') {
    console.error('ERROR: Usando valores placeholder en .env');
    return null;
  }

  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      rejectUnauthorized: false
    },
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 3,
    debug: true,
    logger: true
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error('ERROR en verificación de email:', error);
      console.log('\n🔧 GUÍA DE SOLUCIÓN:');
      console.log('1. Verifica que EMAIL_USER sea tu email real de Gmail');
      console.log('2. Verifica que EMAIL_PASS sea una contraseña de aplicación (16 caracteres)');
      console.log('3. Asegúrate de tener habilitada la verificación en 2 pasos en Google');
      console.log('4. Genera una nueva contraseña de aplicación en: https://myaccount.google.com/apppasswords');
      console.log('5. Reinicia el servidor después de actualizar las variables');
      console.log('6. EMAIL_PASS no debe tener espacios - ejemplo: jzkulnzczqpnkeii');
      console.log('Posibles causas específicas:');
      if (error.message.includes('Invalid login')) {
        console.log('- CAUSA: Contraseña de aplicación incorrecta');
      } else if (error.message.includes('Username and Password not accepted')) {
        console.log('- CAUSA: Credenciales rechazadas - genera nueva contraseña de aplicación');
      } else if (error.message.includes('Connection timeout')) {
        console.log('- CAUSA: Problema de red o firewall');
      }
      console.log('');
    } else {
      console.log('EXITO: Servidor de email configurado correctamente');
      console.log('Listo para enviar emails desde:', emailUser);
    }
  });

  return transporter;
};

let transporter;
try {
  transporter = crearTransporter();
  console.log('Transporter creado:', !!transporter);
} catch (error) {
  console.error('❌ Error crítico creando transporter:', error);
  transporter = null;
}

const verificarConfiguracionEmail = (req, res, next) => {
  if (!transporter) {
    return res.status(500).json({
      error: 'Servicio de email no configurado',
      codigo: 'EMAIL_NOT_CONFIGURED',
      mensaje: 'El administrador debe configurar las credenciales de email'
    });
  }
  next();
};

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://accounts.google.com',
    'https://www.googleapis.com',
    'https://biosysvet.site' 
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

/* ======================
   Conexión a MongoDB Atlas
   ====================== */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Conectado a MongoDB Atlas");
    
    console.log("🤖 Iniciando sistema automático de gestión de citas...");
    setTimeout(() => {
      iniciarSistemaAutomatico();
    }, 3000);
    
  } catch (err) {
    console.error("❌ Error al conectar MongoDB:", err.message);
    process.exit(1);
  }
};
connectDB();

/* ======================
   MODELOS - SIN CAMBIOS
   ====================== */

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, trim: true },
    password: { type: String, required: true },
    telefono: { 
      type: String, 
      required: true, 
      trim: true,
      validate: {
        validator: function(v) {
          return /^\+?[\d\s\-\(\)]{7,15}$/.test(v);
        },
        message: 'El teléfono debe tener un formato válido'
      }
    },
    direccion: {
      calle: { type: String, required: true, trim: true },
      ciudad: { type: String, required: true, trim: true },
      estado: { type: String, required: true, trim: true },
      pais: { type: String, required: true, trim: true, default: 'Colombia' }
    },
    role: { type: String, default: "user", enum: ["user", "admin"] },
    googleId: { type: String, unique: true, sparse: true },
    profilePicture: { type: String },
    authMethod: { type: String, enum: ["local", "google", "both"], default: "local" },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    pendingActivation: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre('save', function(next) {
  if (this.googleId && !this.emailVerified) {
    this.emailVerified = true;
    this.pendingActivation = false;
  }
  next();
});

const User = mongoose.model("User", userSchema);

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
  },
  category: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
  },
});

const CartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  items: [CartItemSchema],
  total: {
    type: Number,
    default: 0,
  },
  itemCount: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

CartSchema.pre('save', function(next) {
  this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.lastUpdated = new Date();
  next();
});

CartSchema.methods.cleanupItems = function() {
  this.items = this.items.filter(item => item.quantity > 0);
  return this;
};

const Cart = mongoose.model('Cart', CartSchema);

const mascotaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    especie: { type: String, required: true, trim: true },
    raza: { type: String, required: true, trim: true },
    edad: { type: Number, required: true, min: 0, max: 15 },
    genero: { type: String, required: true, enum: ["Macho", "Hembra"] },
    estado: { type: String, required: true, trim: true },
    enfermedades: { type: String, default: "", trim: true },
    historial: { type: String, default: "", trim: true },
    imagen: { type: String, default: "" },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vacunas: [
      {
        nombre: { type: String, required: true, trim: true },
        fecha: { type: Date, required: true },
        imagen: String,
      },
    ],
    operaciones: [
      {
        nombre: { type: String, required: true, trim: true },
        descripcion: { type: String, required: true, trim: true },
        fecha: { type: Date, required: true },
        imagen: String,
      },
    ],
  },
  { timestamps: true }
);
const Mascota = mongoose.model("Mascota", mascotaSchema);

const productoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    precio: { type: Number, required: true, min: 0 },
    imagen: String,
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    descuento: {
      tiene: { type: Boolean, default: false },
      porcentaje: { 
        type: Number, 
        default: 0, 
        min: 0, 
        max: 100,
        validate: {
          validator: function(v) {
            if (this.descuento.tiene && (v <= 0 || v > 100)) {
              return false;
            }
            return true;
          },
          message: 'El porcentaje de descuento debe estar entre 1 y 100'
        }
      },
      fechaInicio: { type: Date },
      fechaFin: { type: Date }
    },
    garantia: {
      tiene: { type: Boolean, default: false },
      meses: { 
        type: Number, 
        default: 0, 
        min: 0,
        validate: {
          validator: function(v) {
            if (this.garantia.tiene && v <= 0) {
              return false;
            }
            return true;
          },
          message: 'Los meses de garantía deben ser mayor a 0'
        }
      },
      descripcion: { type: String, default: "", trim: true }
    },
    envioGratis: { 
      type: Boolean, 
      default: false 
    },
    stock: { type: Number, default: 0, min: 0 },
    categoria: { 
      type: String, 
      enum: ["alimento", "juguetes", "medicamentos", "accesorios", "higiene", "otros"],
      default: "otros"
    },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productoSchema.methods.getPrecioConDescuento = function() {
  if (!this.descuento.tiene || this.descuento.porcentaje <= 0) {
    return this.precio;
  }
  
  const ahora = new Date();
  if (this.descuento.fechaInicio && ahora < this.descuento.fechaInicio) {
    return this.precio;
  }
  if (this.descuento.fechaFin && ahora > this.descuento.fechaFin) {
    return this.precio;
  }
  
  const descuentoDecimal = this.descuento.porcentaje / 100;
  return this.precio * (1 - descuentoDecimal);
};

productoSchema.methods.isDescuentoVigente = function() {
  if (!this.descuento.tiene) return false;
  
  const ahora = new Date();
  if (this.descuento.fechaInicio && ahora < this.descuento.fechaInicio) {
    return false;
  }
  if (this.descuento.fechaFin && ahora > this.descuento.fechaFin) {
    return false;
  }
  
  return true;
};

const Producto = mongoose.model("Producto", productoSchema);

const citaSchema = new mongoose.Schema(
  {
    mascota: { type: mongoose.Schema.Types.ObjectId, ref: "Mascota", required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tipo: { type: String, required: true, enum: ["consulta", "operacion", "vacunacion", "emergencia"] },
    fecha: { type: Date, required: true },
    hora: { type: String, required: true },
    motivo: { type: String, required: true, trim: true },
    estado: { type: String, default: "pendiente", enum: ["pendiente", "confirmada", "cancelada", "completada"] },
    notas: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

citaSchema.index({ fecha: 1, hora: 1 }, { unique: true });

const Cita = mongoose.model("Cita", citaSchema);

/* ======================
   🤖 SISTEMA AUTOMÁTICO DE GESTIÓN DE CITAS - SIN CAMBIOS
   ====================== */

const actualizarCitasVencidas = async () => {
  try {
    const ahora = new Date();
    console.log('🔄 Iniciando actualización de citas vencidas...');

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const ahoraHora = new Date().toTimeString().substring(0, 5);

    const result = await Cita.updateMany(
      {
        $and: [
          { estado: { $in: ['pendiente', 'confirmada'] } },
          {
            $or: [
              { fecha: { $lt: hoy } },
              {
                $and: [
                  { fecha: { $gte: hoy } },
                  { fecha: { $lt: new Date(hoy.getTime() + 24*60*60*1000) } },
                  { hora: { $lt: ahoraHora } }
                ]
              }
            ]
          }
        ]
      },
      {
        $set: { estado: 'completada' },
        $currentDate: { updatedAt: true }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ ${result.modifiedCount} citas actualizadas a estado "completada"`);
    } else {
      console.log('ℹ️ No hay citas vencidas para actualizar');
    }

    return result;
  } catch (error) {
    console.error('❌ Error actualizando citas vencidas:', error);
    return null;
  }
};

const eliminarCitasAntiguas = async () => {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 3);
    fechaLimite.setHours(23, 59, 59, 999);
    
    console.log('🗑️ Iniciando eliminación de citas antiguas...');
    console.log('📅 Eliminando citas anteriores a:', fechaLimite.toLocaleDateString());

    const citasParaEliminar = await Cita.find({
      fecha: { $lt: fechaLimite },
      estado: { $in: ['completada', 'cancelada'] }
    }).populate('mascota', 'nombre').populate('usuario', 'name email');

    if (citasParaEliminar.length > 0) {
      console.log('📋 Citas que serán eliminadas:');
      citasParaEliminar.forEach(cita => {
        console.log(`  - ${cita.mascota?.nombre || 'Mascota'} (${cita.usuario?.name}) - ${cita.fecha.toLocaleDateString()} - ${cita.estado}`);
      });

      const result = await Cita.deleteMany({
        fecha: { $lt: fechaLimite },
        estado: { $in: ['completada', 'cancelada'] }
      });

      console.log(`✅ ${result.deletedCount} citas eliminadas exitosamente`);
      return result;
    } else {
      console.log('ℹ️ No hay citas antiguas para eliminar');
      return { deletedCount: 0 };
    }

  } catch (error) {
    console.error('❌ Error eliminando citas antiguas:', error);
    return null;
  }
};

const ejecutarMantenimientoCitas = async () => {
  console.log('🤖 === INICIANDO MANTENIMIENTO AUTOMÁTICO DE CITAS ===');
  console.log('🕐 Timestamp:', new Date().toLocaleString());

  try {
    const resultadoActualizacion = await actualizarCitasVencidas();
    const resultadoEliminacion = await eliminarCitasAntiguas();

    console.log('📊 === RESUMEN DEL MANTENIMIENTO ===');
    console.log(`📝 Citas actualizadas: ${resultadoActualizacion?.modifiedCount || 0}`);
    console.log(`🗑️ Citas eliminadas: ${resultadoEliminacion?.deletedCount || 0}`);
    console.log('✅ Mantenimiento completado exitosamente');
    console.log('==========================================');

    return {
      success: true,
      citasActualizadas: resultadoActualizacion?.modifiedCount || 0,
      citasEliminadas: resultadoEliminacion?.deletedCount || 0,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('❌ Error en mantenimiento de citas:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

const obtenerEstadisticasCitas = async () => {
  try {
    const ahora = new Date();
    const hace3Dias = new Date();
    hace3Dias.setDate(hace3Dias.getDate() - 3);

    const stats = await Cita.aggregate([
      {
        $facet: {
          porEstado: [
            {
              $group: {
                _id: '$estado',
                count: { $sum: 1 }
              }
            }
          ],
          vencidas: [
            {
              $match: {
                fecha: { $lt: ahora },
                estado: { $in: ['pendiente', 'confirmada'] }
              }
            },
            {
              $count: 'total'
            }
          ],
          elegiblesEliminacion: [
            {
              $match: {
                fecha: { $lt: hace3Dias },
                estado: { $in: ['completada', 'cancelada'] }
              }
            },
            {
              $count: 'total'
            }
          ],
          total: [
            {
              $count: 'total'
            }
          ]
        }
      }
    ]);

    return {
      porEstado: stats[0].porEstado,
      citasVencidas: stats[0].vencidas[0]?.total || 0,
      elegiblesEliminacion: stats[0].elegiblesEliminacion[0]?.total || 0,
      totalCitas: stats[0].total[0]?.total || 0,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
};

const INTERVALO_MANTENIMIENTO = 2 * 60 * 60 * 1000;

let intervalId = null;

const iniciarSistemaAutomatico = () => {
  console.log('🚀 Iniciando sistema automático de gestión de citas...');
  console.log(`⏰ Configurado para ejecutarse cada ${INTERVALO_MANTENIMIENTO / (60 * 60 * 1000)} horas`);
  
  setTimeout(() => {
    console.log('🔄 Ejecutando mantenimiento inicial...');
    ejecutarMantenimientoCitas();
  }, 30000);
  
  intervalId = setInterval(ejecutarMantenimientoCitas, INTERVALO_MANTENIMIENTO);
  
  console.log('✅ Sistema automático iniciado exitosamente');
};

const detenerSistemaAutomatico = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('🛑 Sistema automático detenido');
  }
};

/* ======================
   Middlewares de Auth - SIN CAMBIOS
   ====================== */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ error: "Acceso denegado: Debes iniciar sesion primero" });

  try {
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token no proporcionado" });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Debes iniciar sesion primero" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "No tienes permisos de administrador" });
  next();
};

/* ======================
   Configuración de Multer - SIN CAMBIOS
   ====================== */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* ======================
   FUNCIONES DE UTILIDAD - SIN CAMBIOS
   ====================== */
const esHorarioValido = (hora) => {
  const [hours, minutes] = hora.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  const mañanaInicio = 7 * 60;
  const mañanaFin = 12 * 60;
  const tardeInicio = 14 * 60;
  const tardeFin = 18 * 60;
  
  return (timeInMinutes >= mañanaInicio && timeInMinutes <= mañanaFin) ||
         (timeInMinutes >= tardeInicio && timeInMinutes <= tardeFin);
};

const esFechaValida = (fechaString) => {
  try {
    const fechaCita = new Date(fechaString + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaCita < hoy) return false;
    if (fechaCita.getDay() === 0) return false;
    
    return true;
  } catch (error) {
    console.error('Error validando fecha:', error);
    return false;
  }
};

const normalizarFecha = (fechaString) => {
  return new Date(fechaString + 'T00:00:00');
};

const validarTelefono = (telefono) => {
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  return /^\+?[\d]{7,15}$/.test(telefonoLimpio);
};

const validarDireccion = (direccion) => {
  const { calle, ciudad, estado } = direccion;
  
  if (!calle || !ciudad || !estado) {
    return { valido: false, mensaje: "Todos los campos de dirección son obligatorios" };
  }
  
  if (calle.trim().length < 5) {
    return { valido: false, mensaje: "La dirección debe tener al menos 5 caracteres" };
  }
  
  if (ciudad.trim().length < 2) {
    return { valido: false, mensaje: "La ciudad debe tener al menos 2 caracteres" };
  }
  
  if (estado.trim().length < 2) {
    return { valido: false, mensaje: "El estado debe tener al menos 2 caracteres" };
  }
  
  return { valido: true };
};

const validarProducto = (datos) => {
  const { nombre, descripcion, precio, descuento, garantia, categoria, stock } = datos;
  
  if (!nombre || !descripcion || precio === undefined) {
    return { valido: false, mensaje: "Nombre, descripción y precio son obligatorios" };
  }
  
  if (precio < 0) {
    return { valido: false, mensaje: "El precio no puede ser negativo" };
  }
  
  if (descuento && descuento.tiene) {
    if (!descuento.porcentaje || descuento.porcentaje <= 0 || descuento.porcentaje > 100) {
      return { valido: false, mensaje: "El porcentaje de descuento debe estar entre 1 y 100" };
    }
    
    if (descuento.fechaInicio && descuento.fechaFin) {
      if (new Date(descuento.fechaInicio) >= new Date(descuento.fechaFin)) {
        return { valido: false, mensaje: "La fecha de inicio del descuento debe ser anterior a la fecha de fin" };
      }
    }
  }
  
  if (garantia && garantia.tiene) {
    if (!garantia.meses || garantia.meses <= 0) {
      return { valido: false, mensaje: "Los meses de garantía deben ser mayor a 0" };
    }
  }
  
  if (stock !== undefined && stock < 0) {
    return { valido: false, mensaje: "El stock no puede ser negativo" };
  }
  
  const categoriasValidas = ["alimento", "juguetes", "medicamentos", "accesorios", "higiene", "otros"];
  if (categoria && !categoriasValidas.includes(categoria)) {
    return { valido: false, mensaje: "Categoría no válida" };
  }
  
  return { valido: true };
};

/* ======================
   📧 FUNCIONES DE EMAIL - SIN CAMBIOS
   ====================== */

const generarTokenVerificacion = () => {
  return crypto.randomBytes(32).toString('hex');
};

const limpiarTokensExpirados = async () => {
  try {
    const result = await User.deleteMany({
      emailVerificationExpires: { $lt: new Date() },
      emailVerified: false
    });
    console.log(`🗑️ Tokens expirados eliminados: ${result.deletedCount}`);
  } catch (error) {
    console.error('Error limpiando tokens:', error);
  }
};

setInterval(limpiarTokensExpirados, 60 * 60 * 1000);

const plantillaEmailVerificacion = (nombre, tokenVerificacion) => {
  const urlVerificacion = `${FRONTEND_URL}/verificar-email?token=${tokenVerificacion}`;
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificar Email - Clínica Veterinaria</title>
        <style>
            @media only screen and (max-width: 600px) {
                .container { width: 95% !important; padding: 20px !important; }
                .content { padding: 20px !important; }
                .verify-button { padding: 12px 20px !important; font-size: 14px !important; }
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #7c3aed, #6d28d9);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .logo {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .content {
                padding: 40px 30px;
            }
            .verify-button {
                display: inline-block;
                background: linear-gradient(135deg, #7c3aed, #6d28d9);
                color: white !important;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
                transition: transform 0.2s;
            }
            .verify-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(124, 58, 237, 0.3);
            }
            .warning {
                background: #fef2f2;
                border-left: 4px solid #dc2626;
                padding: 16px;
                border-radius: 4px;
                margin: 20px 0;
            }
            .footer {
                background: #f8fafc;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #64748b;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🐾 Clínica Veterinaria</div>
                <p>Tu cuenta está casi lista</p>
            </div>
            
            <div class="content">
                <h2 style="color: #7c3aed; margin-bottom: 20px;">¡Hola ${nombre}!</h2>
                
                <p>Gracias por registrarte en nuestra clínica veterinaria. Solo necesitas verificar tu email para activar tu cuenta.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${urlVerificacion}" class="verify-button">
                        ✅ Verificar mi correo
                    </a>
                </div>
                
                <p>Si el botón no funciona, copia este enlace:</p>
                <p style="word-break: break-all; background: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px;">
                    ${urlVerificacion}
                </p>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong> Este enlace expira en 24 horas.
                </div>
                
                <p><strong>Una vez verificado podrás:</strong></p>
                <ul style="color: #64748b;">
                    <li>Registrar tus mascotas</li>
                    <li>Agendar citas veterinarias</li>
                    <li>Acceder a nuestros productos</li>
                    <li>Gestionar tu perfil</li>
                    <li>Guardar tu carrito de compras</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>Este email fue enviado desde Clínica Veterinaria</p>
                <p>Si no te registraste, puedes ignorar este mensaje</p>
                <p>© ${new Date().getFullYear()} Todos los derechos reservados</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

const enviarEmailVerificacion = async (email, nombre, token) => {
  if (!transporter) {
    console.error('❌ Transporter no configurado');
    return { success: false, error: 'Servicio de email no configurado' };
  }

  try {
    const mailOptions = {
      from: {
        name: 'Clínica Veterinaria',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🐾 Verificar tu cuenta - Clínica Veterinaria',
      html: plantillaEmailVerificacion(nombre, token),
      replyTo: process.env.EMAIL_USER,
      headers: {
        'X-Mailer': 'Clinica-Veterinaria-App',
        'X-Priority': '3'
      }
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email de verificación enviado a:', email);
    console.log('📧 Message ID:', result.messageId);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    
    let errorMessage = 'Error desconocido al enviar email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Credenciales de email incorrectas. Verifica EMAIL_USER y EMAIL_PASS';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Error de conexión con Gmail. Verifica tu conexión a internet';
    } else if (error.code === 'EENVELOPE') {
      errorMessage = 'Dirección de email inválida';
    }
    
    return { success: false, error: errorMessage, details: error.message };
  }
};

/* ======================
   FUNCIONES GOOGLE OAUTH - SIN CAMBIOS
   ====================== */

const verifyGoogleToken = async (token) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload.email_verified) {
      throw new Error('Email de Google no verificado');
    }
    
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified,
    };
  } catch (error) {
    console.error('Error verificando token de Google:', error);
    throw new Error('Token de Google inválido');
  }
};


/* ======================
   💳 RUTAS DE MERCADO PAGO
   ====================== */

// Crear preferencia de pago
router.post("/crear-preferencia-pago", verifyToken, async (req, res) => {
  try {
    const { items, payer } = req.body;

    console.log('📥 Datos recibidos para pago:', { items: items?.length, payer: payer?.email });

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    console.log('💰 Total calculado:', total, 'COP');

    const preferenceClient = new Preference(mercadopagoClient);

    // Determinar si usar URLs completas basado en el entorno
const usarURLsCompletas = BACKEND_URL.startsWith('https://');
    const body = {
      items: items.map(item => ({
        id: item.id || String(Math.random()),
        title: String(item.title).substring(0, 256),
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
        currency_id: "COP",
        description: item.description ? String(item.description).substring(0, 256) : undefined
      })),
      payer: {
        name: payer?.name || req.user.name || "Usuario",
        email: payer?.email || req.user.email || "test@test.com",
        phone: {
          area_code: "57",
          number: String(payer?.phone || "3001234567").replace(/\D/g, '').substring(0, 15)
        },
        address: {
          street_name: payer?.address?.street_name || "Calle principal",
          street_number: String(payer?.address?.street_number || 123),
          zip_code: payer?.address?.zip_code || "110111"
        }
      },
      statement_descriptor: "CLINICA VET",
      external_reference: String(req.user.id),
      metadata: {
        user_id: String(req.user.id),
        user_email: String(req.user.email),
        order_date: new Date().toISOString()
      }
    };

    // Solo agregar back_urls si NO estamos en localhost
    if (usarURLsCompletas) {
      body.back_urls = {
        success: `${FRONTEND_URL}/pago-exitoso`,
        failure: `${FRONTEND_URL}/pago-fallido`,
        pending: `${FRONTEND_URL}/pago-pendiente`
      };
      body.auto_return = "approved";
      body.notification_url = `${BACKEND_URL}/api/webhook-mercadopago`;
      
      console.log('✅ Usando URLs de retorno (producción/ngrok)');
    } else {
      console.log('⚠️ Modo localhost - sin URLs de retorno');
      console.log('📌 Después del pago, cierra manualmente la ventana de Mercado Pago');
    }

    console.log('🔄 Creando preferencia en Mercado Pago...');

    const response = await preferenceClient.create({ body });

    console.log('✅ Preferencia creada:', response.id);

    res.json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      preference_id: response.id,
      external_reference: response.external_reference
    });

  } catch (error) {
    console.error("❌ Error completo:", error);
    console.error("❌ Error mensaje:", error.message);
    
    res.status(500).json({ 
      error: "Error al procesar el pago",
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Webhook Mercado Pago
router.post("/webhook-mercadopago", async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('🔔 Webhook recibido:', type, data);

    res.sendStatus(200);

    if (type === "payment" && data?.id) {
      try {
        const paymentClient = new Payment(mercadopagoClient);
        const paymentData = await paymentClient.get({ id: data.id });

        console.log('💳 Estado del pago:', paymentData.status);
        console.log('💰 Monto:', paymentData.transaction_amount, paymentData.currency_id);

        switch (paymentData.status) {
          case "approved":
            console.log('✅ Pago aprobado! ID:', paymentData.id);
            // TODO: Aquí puedes vaciar el carrito del usuario
            // await Cart.findOneAndUpdate({ userId: paymentData.metadata.user_id }, { items: [] });
            break;
          
          case "pending":
            console.log('⏳ Pago pendiente');
            break;
          
          case "rejected":
            console.log('❌ Pago rechazado');
            break;
        }

      } catch (error) {
        console.error('❌ Error procesando pago del webhook:', error);
      }
    }

  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.sendStatus(500);
  }
});

// Verificar estado de pago
router.get("/verificar-pago/:paymentId", verifyToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const paymentClient = new Payment(mercadopagoClient);
    const paymentData = await paymentClient.get({ id: paymentId });

    res.json({
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      amount: paymentData.transaction_amount,
      currency: paymentData.currency_id,
      payment_method: paymentData.payment_method_id,
      date_approved: paymentData.date_approved,
      external_reference: paymentData.external_reference
    });

  } catch (error) {
    console.error('❌ Error verificando pago:', error);
    res.status(500).json({ 
      error: "Error al verificar pago",
      message: error.message 
    });
  }
});


// Webhook Mercado Pago
router.post("/webhook-mercadopago", async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('🔔 Webhook recibido de Mercado Pago:', type);

    res.sendStatus(200);

    if (type === "payment") {
      const paymentId = data.id;
      
      try {
        const payment = new Payment(mercadopagoClient);
        const paymentData = await payment.get({ id: paymentId });

        console.log('💳 Estado del pago:', paymentData.status);
        console.log('💰 Monto:', paymentData.transaction_amount, paymentData.currency_id);
        console.log('👤 Usuario ID:', paymentData.metadata?.user_id);

        switch (paymentData.status) {
          case "approved":
            console.log('✅ Pago aprobado!');
            // TODO: Vaciar carrito, actualizar orden
            break;
          
          case "pending":
            console.log('⏳ Pago pendiente');
            break;
          
          case "rejected":
            console.log('❌ Pago rechazado');
            break;
        }

      } catch (error) {
        console.error('❌ Error procesando pago:', error);
      }
    }

  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.sendStatus(500);
  }
});

// Verificar estado de pago
// Verificar estado de pago
router.get("/verificar-pago/:paymentId", verifyToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = new Payment(mercadopagoClient);
    const paymentData = await payment.get({ id: paymentId });

    res.json({
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      amount: paymentData.transaction_amount,
      currency: paymentData.currency_id,
      payment_method: paymentData.payment_method_id,
      date_approved: paymentData.date_approved,
      external_reference: paymentData.external_reference
    });

  } catch (error) {
    console.error('❌ Error verificando pago:', error);
    res.status(500).json({ error: "Error al verificar pago" });
  }
});

/* ======================
   🛒 RUTAS DEL CARRITO - SIN CAMBIOS
   ====================== */

router.get("/cart/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }

    cart.cleanupItems();
    
    res.json({
      items: cart.items.map(item => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        category: item.category,
        stock: item.stock,
      })),
      total: cart.total,
      itemCount: cart.itemCount,
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

router.post("/cart", verifyToken, async (req, res) => {
  try {
    const { userId, items } = req.body;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items debe ser un array' });
    }

    const cartItems = items.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      category: item.category,
      stock: item.stock,
    }));

    let cart = await Cart.findOne({ userId });
    
    if (cart) {
      cart.items = cartItems;
    } else {
      cart = new Cart({ userId, items: cartItems });
    }

    cart.cleanupItems();
    await cart.save();

    res.json({
      message: 'Carrito actualizado exitosamente',
      total: cart.total,
      itemCount: cart.itemCount,
    });
  } catch (error) {
    console.error('Error saving cart:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

router.delete("/cart/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    await Cart.findOneAndUpdate(
      { userId },
      { items: [], total: 0, itemCount: 0, lastUpdated: new Date() },
      { upsert: true }
    );

    res.json({ message: 'Carrito limpiado exitosamente' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

router.put("/cart/item", verifyToken, async (req, res) => {
  try {
    const { userId, item } = req.body;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      cartItem => cartItem.productId === item.id
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += item.quantity || 1;
    } else {
      cart.items.push({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        image: item.image,
        category: item.category,
        stock: item.stock,
      });
    }

    cart.cleanupItems();
    await cart.save();

    res.json({
      message: 'Item agregado al carrito',
      total: cart.total,
      itemCount: cart.itemCount,
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

router.delete("/cart/item/:userId/:productId", verifyToken, async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Carrito no encontrado' });
    }

    cart.items = cart.items.filter(item => item.productId !== productId);
    await cart.save();

    res.json({
      message: 'Item eliminado del carrito',
      total: cart.total,
      itemCount: cart.itemCount,
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

router.put("/cart/quantity", verifyToken, async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Carrito no encontrado' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item no encontrado en el carrito' });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    cart.cleanupItems();
    await cart.save();

    res.json({
      message: 'Cantidad actualizada',
      total: cart.total,
      itemCount: cart.itemCount,
    });
  } catch (error) {
    console.error('Error updating item quantity:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/* ======================
   📧 RUTAS DE AUTENTICACIÓN ACTUALIZADAS CON VERIFICACIÓN EMAIL
   ====================== */

// 📧 REGISTRO TRADICIONAL CON VERIFICACIÓN POR EMAIL - ACTUALIZADO
router.post("/register", verificarConfiguracionEmail, async (req, res) => {
  try {
    const { name, email, password, telefono, direccion, role } = req.body;
    
    // Validaciones básicas
    if (!name || !email || !password || !telefono || !direccion) {
      return res.status(400).json({ 
        error: "Todos los campos son obligatorios",
        campos: ["name", "email", "password", "telefono", "direccion"]
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    // Validar teléfono
    if (!validarTelefono(telefono)) {
      return res.status(400).json({ error: "El teléfono debe tener un formato válido (7-15 dígitos)" });
    }

    // Validar dirección
    const validacionDireccion = validarDireccion(direccion);
    if (!validacionDireccion.valido) {
      return res.status(400).json({ error: validacionDireccion.mensaje });
    }

    // Verificar si el email ya existe
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      if (exists.emailVerified) {
        return res.status(400).json({ error: "El correo ya está registrado y verificado" });
      } else {
        // Email existe pero no verificado - eliminar registro anterior
        await User.deleteOne({ _id: exists._id });
        console.log('🗑️ Registro anterior no verificado eliminado para:', email);
      }
    }

    // 📧 GENERAR TOKEN DE VERIFICACIÓN - NUEVO
    const tokenVerificacion = generarTokenVerificacion();
    const expiracionToken = new Date();
    expiracionToken.setHours(expiracionToken.getHours() + 24); // 24 horas

    const hashed = await bcrypt.hash(password, 10);
    
    // 📧 CREAR USUARIO PENDIENTE DE VERIFICACIÓN - ACTUALIZADO
    const nuevoUsuario = new User({ 
      name: name.trim(), 
      email: email.trim().toLowerCase(), 
      password: hashed, 
      telefono: telefono.trim(),
      direccion: {
        calle: direccion.calle.trim(),
        ciudad: direccion.ciudad.trim(),
        estado: direccion.estado.trim(),
        pais: direccion.pais ? direccion.pais.trim() : 'Colombia'
      },
      role,
      // 📧 CAMPOS DE VERIFICACIÓN - NUEVO
      emailVerificationToken: tokenVerificacion,
      emailVerificationExpires: expiracionToken,
      emailVerified: false,
      pendingActivation: true
    });

    await nuevoUsuario.save();
    console.log('📧 Usuario creado pendiente de verificación:', email);

    // 📧 ENVIAR EMAIL DE VERIFICACIÓN CON MEJOR MANEJO DE ERRORES
    const emailEnviado = await enviarEmailVerificacion(email, name, tokenVerificacion);
    
    if (emailEnviado.success) {
      res.status(201).json({ 
        message: "Registro iniciado exitosamente",
        requiereVerificacion: true,
        email: email,
        instrucciones: "Hemos enviado un email de verificación a tu correo. Por favor, revisa tu bandeja de entrada y spam, luego haz clic en el enlace para activar tu cuenta.",
        messageId: emailEnviado.messageId // Para debugging
      });
    } else {
      // Si falla el envío del email, eliminar el usuario creado
      await User.deleteOne({ _id: nuevoUsuario._id });
      
      console.error('❌ Error enviando email de verificación:', emailEnviado.error);
      
      res.status(500).json({ 
        error: "Error al enviar email de verificación",
        codigo: "EMAIL_SEND_FAILED",
        mensaje: "No pudimos enviar el email de verificación. Por favor, verifica tu conexión e intenta de nuevo.",
        detalles: process.env.NODE_ENV === 'development' ? emailEnviado.error : undefined
      });
    }

  } catch (error) {
    console.error("Error en registro:", error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({ error: "Error de validación", detalles: errors });
    } else if (error.code === 11000) {
      res.status(400).json({ error: "El email ya está registrado" });
    } else {
      res.status(500).json({ error: "Error en el servidor" });
    }
  }
});

// 📧 RUTA PARA VERIFICAR EMAIL MEJORADA - NUEVO
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('🔍 Verificando token:', token);

    // Validar formato del token
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ 
        error: "Token inválido",
        codigo: "INVALID_FORMAT",
        accion: "El formato del token no es válido"
      });
    }

    // Buscar usuario con el token
    const usuario = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }, // Token no expirado
      emailVerified: false
    });

    if (!usuario) {
      return res.status(400).json({ 
        error: "Token de verificación inválido o expirado",
        codigo: "TOKEN_NOT_FOUND",
        accion: "Por favor, regístrate nuevamente o solicita un nuevo email de verificación"
      });
    }

    // Activar usuario
    usuario.emailVerified = true;
    usuario.pendingActivation = false;
    usuario.emailVerificationToken = undefined;
    usuario.emailVerificationExpires = undefined;
    
    await usuario.save();
    
    console.log('✅ Email verificado exitosamente para:', usuario.email);

    res.json({
      success: true,
      message: "¡Email verificado exitosamente!",
      usuario: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email
      },
      redirigir: "/login"
    });

  } catch (error) {
    console.error("Error verificando email:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      codigo: "SERVER_ERROR"
    });
  }
});

// 📧 REENVIAR VERIFICACIÓN CON MIDDLEWARE - ACTUALIZADO
router.post("/resend-verification", verificarConfiguracionEmail, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email es requerido" });
    }

    // Verificar rate limiting
    if (!checkEmailRateLimit(email)) {
      return res.status(429).json({ 
        error: "Debes esperar 1 minuto antes de solicitar otro email",
        codigo: "RATE_LIMIT",
        tiempoEspera: "60 segundos"
      });
    }

    // Buscar usuario no verificado
    const usuario = await User.findOne({
      email: email.toLowerCase(),
      emailVerified: false,
      pendingActivation: true
    });

    if (!usuario) {
      return res.status(404).json({ 
        error: "No se encontró una cuenta pendiente de verificación con este email",
        codigo: "USER_NOT_FOUND"
      });
    }

    // Generar nuevo token
    const nuevoToken = generarTokenVerificacion();
    const nuevaExpiracion = new Date();
    nuevaExpiracion.setHours(nuevaExpiracion.getHours() + 24);

    usuario.emailVerificationToken = nuevoToken;
    usuario.emailVerificationExpires = nuevaExpiracion;
    await usuario.save();

    // Reenviar email
    const emailEnviado = await enviarEmailVerificacion(email, usuario.name, nuevoToken);
    
    if (emailEnviado.success) {
      res.json({
        message: "Email de verificación reenviado exitosamente",
        email: email,
        expiraEn: "24 horas",
        instrucciones: "Revisa tu bandeja de entrada y spam. El enlace expira en 24 horas."
      });
    } else {
      res.status(500).json({
        error: "Error al reenviar email de verificación",
        codigo: "EMAIL_SEND_FAILED",
        detalles: process.env.NODE_ENV === 'development' ? emailEnviado.error : undefined
      });
    }

  } catch (error) {
    console.error("Error reenviando email:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      codigo: "SERVER_ERROR"
    });
  }
});

// 📧 LOGIN ACTUALIZADO PARA VERIFICAR EMAIL - MODIFICADO
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    const u = await User.findOne({ email: email.toLowerCase() });
    if (!u) return res.status(400).json({ error: "Usuario no encontrado" });

    // 📧 VERIFICAR SI EL EMAIL ESTÁ VERIFICADO (solo para usuarios locales) - NUEVO
    if (!u.googleId && !u.emailVerified) {
      return res.status(403).json({ 
        error: "Debes verificar tu email antes de iniciar sesión",
        requiereVerificacion: true,
        email: u.email,
        mensaje: "Revisa tu bandeja de entrada y haz clic en el enlace de verificación"
      });
    }

    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: u._id, role: u.role }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      user: { 
        id: u._id, 
        name: u.name, 
        email: u.email, 
        telefono: u.telefono,
        direccion: u.direccion,
        role: u.role,
        profilePicture: u.profilePicture,
        authMethod: u.googleId ? 'both' : 'local',
        emailVerified: u.emailVerified
      },
      token,
      redirectTo: u.role === "admin" ? "/admin" : "/home",
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// 📧 ENDPOINT PARA VERIFICAR ESTADO DEL SERVICIO DE EMAIL - NUEVO
router.get("/email/status", verifyToken, isAdmin, (req, res) => {
  const status = {
    configured: !!transporter,
    emailUser: process.env.EMAIL_USER || 'No configurado',
    hasEmailPass: !!(process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'tu-password-de-aplicacion'),
    service: 'Gmail'
  };

  if (status.configured) {
    res.json({
      status: 'Configurado correctamente',
      ...status,
      message: 'El servicio de email está listo para usar'
    });
  } else {
    res.status(500).json({
      status: 'No configurado',
      ...status,
      error: 'El servicio de email no está configurado correctamente',
      instrucciones: [
        '1. Configura EMAIL_USER en .env con tu email de Gmail',
        '2. Configura EMAIL_PASS en .env con una contraseña de aplicación',
        '3. Reinicia el servidor'
      ]
    });
  }
});

/* ======================
   GOOGLE OAUTH ROUTES - MEJORADAS CON VERIFICACIÓN
   ====================== */

// Ruta para autenticación con Google - MEJORADA
router.post("/auth/google", async (req, res) => {
  try {
    const { credential, userData } = req.body;
    
    console.log('📧 Iniciando autenticación con Google...');
    
    if (!credential) {
      return res.status(400).json({ error: "Token de Google requerido" });
    }

    // Verificar el token con Google
    const googleUser = await verifyGoogleToken(credential);
    console.log('✅ Usuario de Google verificado:', googleUser.email);

    // Buscar usuario existente por email o googleId
    let usuario = await User.findOne({ 
      $or: [
        { email: googleUser.email.toLowerCase() },
        { googleId: googleUser.googleId }
      ]
    });

    if (usuario) {
      // Usuario existente - hacer login
      console.log('👤 Usuario existente encontrado, iniciando sesión...');
      
      // Actualizar datos de Google si no los tiene
      if (!usuario.googleId) {
        usuario.googleId = googleUser.googleId;
        usuario.profilePicture = googleUser.picture;
        usuario.authMethod = 'both';
        // 📧 PARA USUARIOS DE GOOGLE, EL EMAIL YA ESTÁ VERIFICADO - NUEVO
        usuario.emailVerified = true;
        usuario.pendingActivation = false;
        await usuario.save();
        console.log('🔄 Datos de Google agregados al usuario existente');
      }

      const token = jwt.sign({ id: usuario._id, role: usuario.role }, JWT_SECRET, { expiresIn: "1d" });

      res.json({
        user: {
          id: usuario._id,
          name: usuario.name,
          email: usuario.email,
          telefono: usuario.telefono,
          direccion: usuario.direccion,
          role: usuario.role,
          profilePicture: usuario.profilePicture || googleUser.picture,
          authMethod: usuario.googleId ? 'both' : 'google',
          emailVerified: true // 📧 GOOGLE EMAILS SIEMPRE ESTÁN VERIFICADOS
        },
        token,
        redirectTo: usuario.role === "admin" ? "/admin" : "/home",
        message: "Sesión iniciada con Google"
      });

    } else {
      // Usuario nuevo - necesita completar registro
      console.log('🆕 Usuario nuevo de Google, requiere datos adicionales...');
      
      // Verificar si se proporcionaron datos adicionales
      if (!userData || !userData.telefono || !userData.direccion) {
        return res.json({
          requiresAdditionalInfo: true,
          googleUser: {
            name: googleUser.name,
            email: googleUser.email,
            picture: googleUser.picture,
            googleId: googleUser.googleId
          },
          message: "Se requiere información adicional para completar el registro"
        });
      }

      // Validar datos adicionales
      if (!validarTelefono(userData.telefono)) {
        return res.status(400).json({ 
          error: "El teléfono debe tener un formato válido (7-15 dígitos)" 
        });
      }

      const validacionDireccion = validarDireccion(userData.direccion);
      if (!validacionDireccion.valido) {
        return res.status(400).json({ error: validacionDireccion.mensaje });
      }

      // Crear nuevo usuario
      const hashedPassword = await bcrypt.hash("google_oauth_" + googleUser.googleId, 10);
      
      const nuevoUsuario = new User({
        name: googleUser.name,
        email: googleUser.email.toLowerCase(),
        password: hashedPassword,
        telefono: userData.telefono.trim(),
        direccion: {
          calle: userData.direccion.calle.trim(),
          ciudad: userData.direccion.ciudad.trim(),
          estado: userData.direccion.estado.trim(),
          pais: userData.direccion.pais || 'Colombia'
        },
        googleId: googleUser.googleId,
        profilePicture: googleUser.picture,
        authMethod: 'google',
        role: "user",
        // 📧 PARA USUARIOS DE GOOGLE, EL EMAIL YA ESTÁ VERIFICADO - NUEVO
        emailVerified: true,
        pendingActivation: false
      });

      await nuevoUsuario.save();
      console.log('✅ Nuevo usuario creado con Google:', nuevoUsuario.email);

      const token = jwt.sign({ id: nuevoUsuario._id, role: nuevoUsuario.role }, JWT_SECRET, { expiresIn: "1d" });

      res.status(201).json({
        user: {
          id: nuevoUsuario._id,
          name: nuevoUsuario.name,
          email: nuevoUsuario.email,
          telefono: nuevoUsuario.telefono,
          direccion: nuevoUsuario.direccion,
          role: nuevoUsuario.role,
          profilePicture: nuevoUsuario.profilePicture,
          authMethod: 'google',
          emailVerified: true // 📧 GOOGLE EMAILS SIEMPRE ESTÁN VERIFICADOS
        },
        token,
        redirectTo: "/home",
        message: "Cuenta creada exitosamente con Google"
      });
    }

  } catch (error) {
    console.error("❌ Error en autenticación con Google:", error);
    
    if (error.message === 'Token de Google inválido' || error.message === 'Email de Google no verificado') {
      return res.status(401).json({ error: error.message });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }
    
    res.status(500).json({ 
      error: "Error en el servidor durante autenticación con Google",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Ruta para vincular cuenta de Google (usuario ya logueado)
router.post("/auth/google/link", verifyToken, async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: "Token de Google requerido" });
    }

    const googleUser = await verifyGoogleToken(credential);
    const usuario = await User.findById(req.user.id);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar que el email coincida
    if (googleUser.email.toLowerCase() !== usuario.email.toLowerCase()) {
      return res.status(400).json({ 
        error: "El email de Google debe coincidir con el email de tu cuenta" 
      });
    }

    // Vincular cuenta
    usuario.googleId = googleUser.googleId;
    usuario.profilePicture = googleUser.picture;
    await usuario.save();

    res.json({
      message: "Cuenta de Google vinculada exitosamente",
      user: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        profilePicture: usuario.profilePicture,
        hasGoogleAuth: true
      }
    });

  } catch (error) {
    console.error("Error vinculando cuenta de Google:", error);
    res.status(500).json({ error: "Error al vincular cuenta de Google" });
  }
});

// Ruta para desvincular Google
router.delete("/auth/google/unlink", verifyToken, async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id);
    
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!usuario.googleId) {
      return res.status(400).json({ error: "No hay cuenta de Google vinculada" });
    }

    usuario.googleId = undefined;
    usuario.profilePicture = undefined;
    await usuario.save();

    res.json({ message: "Cuenta de Google desvinculada exitosamente" });

  } catch (error) {
    console.error("Error desvinculando Google:", error);
    res.status(500).json({ error: "Error al desvincular cuenta de Google" });
  }
});

router.get("/auth/me", verifyToken, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("-password");
    if (!me) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(me);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuario" });
  }
});

// RUTA PARA ACTUALIZAR PERFIL DE USUARIO
router.put("/usuarios/perfil", verifyToken, async (req, res) => {
  try {
    const { name, telefono, direccion } = req.body;
    const usuario = await User.findById(req.user.id);
    
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Validar campos si se proporcionan
    if (telefono && !validarTelefono(telefono)) {
      return res.status(400).json({ error: "El teléfono debe tener un formato válido" });
    }

    if (direccion) {
      const validacionDireccion = validarDireccion(direccion);
      if (!validacionDireccion.valido) {
        return res.status(400).json({ error: validacionDireccion.mensaje });
      }
    }

    // Actualizar campos
    if (name && name.trim()) usuario.name = name.trim();
    if (telefono) usuario.telefono = telefono.trim();
    if (direccion) {
      usuario.direccion = {
        calle: direccion.calle.trim(),
        ciudad: direccion.ciudad.trim(),
        estado: direccion.estado.trim(),
        pais: direccion.pais ? direccion.pais.trim() : usuario.direccion.pais
      };
    }

    await usuario.save();

    res.json({
      message: "Perfil actualizado exitosamente",
      usuario: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        role: usuario.role
      }
    });

  } catch (error) {
    console.error("Error actualizando perfil:", error);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
});

/* ======================
   USUARIOS & MASCOTAS ACTUALIZADOS
   ====================== */
router.get("/usuarios", verifyToken, isAdmin, async (req, res) => {
  try {
    const usuarios = await User.find().select("-password");

    const usuariosConMascotas = await Promise.all(
      usuarios.map(async (u) => {
        const totalMascotas = await Mascota.countDocuments({ usuario: u._id });
        return { 
          ...u.toObject(), 
          totalMascotas,
          direccionCompleta: `${u.direccion.calle}, ${u.direccion.ciudad}, ${u.direccion.estado}`
        };
      })
    );

    res.json(usuariosConMascotas);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

router.get("/usuarios/:id/mascotas", verifyToken, async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select("-password");
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({ error: "No autorizado para ver estas mascotas" });
    }

    const mascotas = await Mascota.find({ usuario: req.params.id });
    res.json({ usuario, mascotas });
  } catch (error) {
    console.error("Error obteniendo mascotas de usuario:", error);
    res.status(500).json({ error: "Error al obtener mascotas del usuario" });
  }
});

/* ======================
   Mascotas
   ====================== */
router.post("/mascotas", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const { nombre, especie, raza, edad, genero, estado, enfermedades, historial } = req.body;

    // Validaciones obligatorias
    if (!nombre || !especie || !raza || !edad || !genero || !estado) {
      const faltantes = [];
      if (!nombre) faltantes.push("nombre");
      if (!especie) faltantes.push("especie");
      if (!raza) faltantes.push("raza");
      if (!edad) faltantes.push("edad");
      if (!genero) faltantes.push("genero");
      if (!estado) faltantes.push("estado");

      return res.status(400).json({
        error: "Faltan campos obligatorios",
        campos: faltantes,
      });
    }

    const edadNum = parseInt(edad);
    if (isNaN(edadNum) || edadNum < 0 || edadNum > 15) {
      return res.status(400).json({ error: "La edad debe ser un número entre 0 y 15" });
    }

    if (!["Macho", "Hembra"].includes(genero)) {
      return res.status(400).json({ error: "El género debe ser 'Macho' o 'Hembra'" });
    }

    const nuevaMascota = new Mascota({
      nombre: nombre.trim(),
      especie: especie.trim(),
      raza: raza.trim(),
      edad: edadNum,
      genero,
      estado: estado.trim(),
      enfermedades: enfermedades ? enfermedades.trim() : "",
      historial: historial ? historial.trim() : "",
      imagen: req.file
        ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
        : "",
      usuario: req.user.id,
    });

    await nuevaMascota.save();
    console.log('✅ Mascota registrada:', nuevaMascota.nombre, 'para usuario:', req.user.id);
    res.status(201).json({ msg: "Mascota registrada", mascota: nuevaMascota });
  } catch (err) {
    console.error("Error creando mascota:", err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      res.status(400).json({ msg: "Error de validación", errors });
    } else {
      res.status(500).json({ msg: "Error en el servidor", error: err.message });
    }
  }
});

router.get("/mascotas", verifyToken, async (req, res) => {
  try {
    console.log('📋 Obteniendo mascotas para usuario:', req.user.id);
    const mascotas = await Mascota.find({ usuario: req.user.id }).populate("usuario", "name email telefono");
    console.log('📋 Mascotas encontradas:', mascotas.length);

    const mascotasConImagen = mascotas.map((m) => ({
      ...m.toObject(),
      imagen: m.imagen
        ? m.imagen.startsWith("http")
          ? m.imagen
          : `${req.protocol}://${req.get("host")}${m.imagen}`
        : null,
    }));

    res.json(mascotasConImagen);
  } catch (error) {
    console.error("❌ Error al listar mascotas:", error);
    res.status(500).json({ message: "Error al listar mascotas", error: error.message });
  }
});

router.put("/mascotas/:id", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const mascota = await Mascota.findById(req.params.id);
    if (!mascota) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    if (req.user.role !== "admin" && mascota.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para editar esta mascota" });
    }

    const { nombre, especie, raza, edad, genero, estado, enfermedades, historial } = req.body;

    // Validar campos obligatorios si se proporcionan
    if (edad !== undefined) {
      const edadNum = parseInt(edad);
      if (isNaN(edadNum) || edadNum < 0 || edadNum > 15) {
        return res.status(400).json({ error: "La edad debe ser un número entre 0 y 15" });
      }
      mascota.edad = edadNum;
    }

    if (genero !== undefined && !["Macho", "Hembra"].includes(genero)) {
      return res.status(400).json({ error: "El género debe ser 'Macho' o 'Hembra'" });
    }

    // Actualizar solo campos no vacíos
    if (nombre && nombre.trim()) mascota.nombre = nombre.trim();
    if (especie && especie.trim()) mascota.especie = especie.trim();
    if (raza && raza.trim()) mascota.raza = raza.trim();
    if (genero) mascota.genero = genero;
    if (estado && estado.trim()) mascota.estado = estado.trim();
    if (enfermedades !== undefined) mascota.enfermedades = enfermedades.trim();
    if (historial !== undefined) mascota.historial = historial.trim();

    if (req.file) {
      mascota.imagen = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    await mascota.save();
    res.json({ msg: "Mascota actualizada correctamente", mascota });
  } catch (err) {
    console.error("Error actualizando mascota:", err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      res.status(400).json({ msg: "Error de validación", errors });
    } else {
      res.status(500).json({ msg: "Error al actualizar mascota", error: err.message });
    }
  }
});

router.get("/mascotas/:id", verifyToken, async (req, res) => {
  try {
    const mascota = await Mascota.findById(req.params.id).populate("usuario", "name email telefono");
    
    if (!mascota) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    const mascotaUserId = mascota.usuario._id.toString();
    const tokenUserId = req.user.id.toString();
    
    if (req.user.role !== "admin" && mascotaUserId !== tokenUserId) {
      return res.status(403).json({ 
        error: "No autorizado para ver esta mascota"
      });
    }

    const mascotaConImagen = {
      ...mascota.toObject(),
      imagen: mascota.imagen
        ? mascota.imagen.startsWith("http")
          ? mascota.imagen
          : `${req.protocol}://${req.get("host")}${mascota.imagen}`
        : null,
    };

    res.json(mascotaConImagen);
  } catch (error) {
    console.error("Error al obtener mascota:", error);
    res.status(500).json({ message: "Error al obtener mascota", error: error.message });
  }
});

// Agregar vacuna a mascota
router.post("/mascotas/:id/vacunas", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, fecha, imagen } = req.body;

    // Validaciones
    if (!nombre || !fecha) {
      return res.status(400).json({ error: "Nombre y fecha de la vacuna son obligatorios" });
    }

    if (!nombre.trim()) {
      return res.status(400).json({ error: "El nombre no puede estar vacío" });
    }

    const mascota = await Mascota.findById(id);
    if (!mascota) return res.status(404).json({ msg: "Mascota no encontrada" });

    // Verificar permisos: admin o dueño
    if (req.user.role !== "admin" && mascota.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para agregar vacunas a esta mascota" });
    }

    // Agregar vacuna al array
    mascota.vacunas.push({
      nombre: nombre.trim(),
      fecha: new Date(fecha),
      imagen: imagen || ""
    });

    await mascota.save();

    res.json({ msg: "Vacuna agregada correctamente", mascota });
  } catch (err) {
    console.error("Error agregando vacuna:", err);
    res.status(500).json({ msg: "Error al agregar vacuna", error: err.message });
  }
});

// Agregar operación a mascota
router.post("/mascotas/:id/operaciones", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, fecha, imagen } = req.body;

    // Validaciones
    if (!nombre || !descripcion || !fecha) {
      return res.status(400).json({ error: "Nombre, descripción y fecha de la operación son obligatorios" });
    }

    if (!nombre.trim() || !descripcion.trim()) {
      return res.status(400).json({ error: "El nombre y descripción no pueden estar vacíos" });
    }

    const mascota = await Mascota.findById(id);
    if (!mascota) return res.status(404).json({ msg: "Mascota no encontrada" });

    // Verificar permisos: admin o dueño
    if (req.user.role !== "admin" && mascota.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para agregar operaciones a esta mascota" });
    }

    // Agregar operación al array
    mascota.operaciones.push({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      fecha: new Date(fecha),
      imagen: imagen || ""
    });

    await mascota.save();

    res.json({ msg: "Operación agregada correctamente", mascota });
  } catch (err) {
    console.error("Error agregando operación:", err);
    res.status(500).json({ msg: "Error al agregar operación", error: err.message });
  }
});

// Eliminar mascota
router.delete("/mascotas/:id", verifyToken, async (req, res) => {
  try {
    const mascota = await Mascota.findById(req.params.id);
    if (!mascota) return res.status(404).json({ error: "Mascota no encontrada" });

    // Validar permisos: admin o dueño
    if (req.user.role !== "admin" && mascota.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para eliminar esta mascota" });
    }

    await mascota.deleteOne();
    res.json({ msg: "Mascota eliminada con éxito" });
  } catch (err) {
    console.error("Error eliminando mascota:", err);
    res.status(500).json({ msg: "Error al eliminar mascota", error: err.message });
  }
});

/* ======================
   RUTAS DE CITAS
   ====================== */

// Crear nueva cita
router.post("/citas", verifyToken, async (req, res) => {
  try {
    console.log('📅 Creando nueva cita:', req.body);
    const { mascotaId, tipo, fecha, hora, motivo, notas } = req.body;

    // Validaciones obligatorias
    if (!mascotaId || !tipo || !fecha || !hora || !motivo) {
      return res.status(400).json({ 
        error: "Los campos mascota, tipo, fecha, hora y motivo son obligatorios" 
      });
    }

    // Validar que la mascota existe y pertenece al usuario
    const mascota = await Mascota.findById(mascotaId);
    if (!mascota) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    if (req.user.role !== "admin" && mascota.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para agendar cita para esta mascota" });
    }

    // Validar fecha
    if (!esFechaValida(fecha)) {
      return res.status(400).json({ 
        error: "Fecha inválida. No se pueden agendar citas en el pasado o los domingos" 
      });
    }

    // Validar horario
    if (!esHorarioValido(hora)) {
      return res.status(400).json({ 
        error: "Horario inválido. Los horarios de atención son: 7:00AM-12:00PM y 2:00PM-6:00PM" 
      });
    }

    // Verificar disponibilidad
    const fechaNormalizada = normalizarFecha(fecha);
    const citaExistente = await Cita.findOne({ 
      fecha: fechaNormalizada, 
      hora: hora 
    });
    
    if (citaExistente) {
      return res.status(400).json({ 
        error: "Ya existe una cita agendada para esa fecha y hora" 
      });
    }

    // Crear la cita
    const nuevaCita = new Cita({
      mascota: mascotaId,
      usuario: req.user.id,
      tipo,
      fecha: fechaNormalizada,
      hora,
      motivo: motivo.trim(),
      notas: notas ? notas.trim() : "",
    });

    await nuevaCita.save();
    console.log('✅ Cita creada exitosamente:', nuevaCita._id, 'para mascota:', mascota.nombre);
    
    // Poblar los datos para la respuesta
    await nuevaCita.populate([
      { path: 'mascota', select: 'nombre especie raza' },
      { path: 'usuario', select: 'name email telefono' }
    ]);

    res.status(201).json({ 
      message: "Cita agendada exitosamente",
      cita: nuevaCita 
    });

  } catch (err) {
    console.error("❌ Error creando cita:", err);
    if (err.code === 11000) {
      return res.status(400).json({ 
        error: "Ya existe una cita agendada para esa fecha y hora" 
      });
    }
    res.status(500).json({ 
      error: "Error al agendar cita",
      details: err.message 
    });
  }
});

// Listar citas del usuario
router.get("/citas", verifyToken, async (req, res) => {
  try {
    console.log('📋 Obteniendo citas para usuario:', req.user.id);
    let query = {};
    
    // Si no es admin, solo puede ver sus propias citas
    if (req.user.role !== "admin") {
      query.usuario = req.user.id;
    }

    const citas = await Cita.find(query)
      .populate('mascota', 'nombre especie raza imagen')
      .populate('usuario', 'name email telefono')
      .sort({ fecha: 1, hora: 1 });

    console.log('📋 Citas encontradas:', citas.length);
    res.json(citas);
  } catch (err) {
    console.error("❌ Error listando citas:", err);
    res.status(500).json({ error: "Error al obtener citas" });
  }
});

// Obtener horarios disponibles
router.get("/citas/horarios-disponibles/:fecha", verifyToken, async (req, res) => {
  try {
    const { fecha } = req.params;
    console.log('🕐 Obteniendo horarios para fecha:', fecha);
    
    if (!esFechaValida(fecha)) {
      return res.status(400).json({ 
        error: "Fecha inválida. No se pueden agendar citas en el pasado o los domingos" 
      });
    }

    // Buscar citas existentes
    const fechaNormalizada = normalizarFecha(fecha);
    const citasExistentes = await Cita.find({ fecha: fechaNormalizada }).select('hora');
    const horasOcupadas = citasExistentes.map(cita => cita.hora);
    
    console.log('⏰ Horas ocupadas para', fecha + ':', horasOcupadas);

    // Generar horarios disponibles
    const horariosDisponibles = [];
    
    // Horarios de la mañana (7:00 AM - 12:00 PM)
    for (let hora = 7; hora <= 11; hora++) {
      for (let minutos = 0; minutos < 60; minutos += 30) {
        const horario = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        if (!horasOcupadas.includes(horario)) {
          horariosDisponibles.push({
            hora: horario,
            periodo: 'mañana',
            disponible: true
          });
        }
      }
    }

    // Agregar 12:00 PM
    if (!horasOcupadas.includes('12:00')) {
      horariosDisponibles.push({
        hora: '12:00',
        periodo: 'mañana',
        disponible: true
      });
    }

    // Horarios de la tarde (2:00 PM - 6:00 PM)
    for (let hora = 14; hora <= 17; hora++) {
      for (let minutos = 0; minutos < 60; minutos += 30) {
        const horario = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        if (!horasOcupadas.includes(horario)) {
          horariosDisponibles.push({
            hora: horario,
            periodo: 'tarde',
            disponible: true
          });
        }
      }
    }

    // Agregar 6:00 PM
    if (!horasOcupadas.includes('18:00')) {
      horariosDisponibles.push({
        hora: '18:00',
        periodo: 'tarde',
        disponible: true
      });
    }

    console.log('✅ Horarios disponibles generados:', horariosDisponibles.length);

    res.json({
      fecha,
      horariosDisponibles,
      totalDisponibles: horariosDisponibles.length
    });

  } catch (err) {
    console.error("❌ Error obteniendo horarios:", err);
    res.status(500).json({ error: "Error al obtener horarios disponibles" });
  }
});

// Actualizar estado de cita (solo admin)
router.put("/citas/:id/estado", verifyToken, isAdmin, async (req, res) => {
  try {
    const { estado } = req.body;
    
    if (!["pendiente", "confirmada", "cancelada", "completada"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    cita.estado = estado;
    await cita.save();

    await cita.populate([
      { path: 'mascota', select: 'nombre especie raza' },
      { path: 'usuario', select: 'name email telefono' }
    ]);

    console.log('📝 Estado de cita actualizado:', req.params.id, 'a', estado);

    res.json({ 
      message: "Estado de cita actualizado",
      cita 
    });

  } catch (err) {
    console.error("❌ Error actualizando cita:", err);
    res.status(500).json({ error: "Error al actualizar cita" });
  }
});

// Cancelar cita (usuario puede cancelar su propia cita)
router.delete("/citas/:id", verifyToken, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    // Solo el dueño de la cita o admin puede cancelarla
    if (req.user.role !== "admin" && cita.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para cancelar esta cita" });
    }

    // Verificar que la cita no esté ya completada
    if (cita.estado === "completada") {
      return res.status(400).json({ error: "No se puede cancelar una cita completada" });
    }

    await cita.deleteOne();
    console.log('❌ Cita cancelada:', req.params.id);
    res.json({ message: "Cita cancelada exitosamente" });

  } catch (err) {
    console.error("❌ Error cancelando cita:", err);
    res.status(500).json({ error: "Error al cancelar cita" });
  }
});

/* ======================
   📡 RUTAS DE API PARA MANTENIMIENTO AUTOMÁTICO DE CITAS
   ====================== */

// Ruta para ejecutar mantenimiento manual (solo admin)
router.post("/admin/citas/mantenimiento", verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('🔧 Mantenimiento manual solicitado por admin:', req.user.id);
    const resultado = await ejecutarMantenimientoCitas();
    
    res.json({
      message: 'Mantenimiento ejecutado exitosamente',
      ...resultado
    });
    
  } catch (error) {
    console.error('Error en mantenimiento manual:', error);
    res.status(500).json({ 
      error: 'Error ejecutando mantenimiento',
      details: error.message 
    });
  }
});

// Ruta para obtener estadísticas de mantenimiento (solo admin)
router.get("/admin/citas/estadisticas-mantenimiento", verifyToken, isAdmin, async (req, res) => {
  try {
    const estadisticas = await obtenerEstadisticasCitas();
    
    if (estadisticas) {
      res.json(estadisticas);
    } else {
      res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Ruta para obtener configuración del sistema automático (solo admin)
router.get("/admin/citas/config-automatico", verifyToken, isAdmin, (req, res) => {
  res.json({
    activo: intervalId !== null,
    intervaloPorHoras: INTERVALO_MANTENIMIENTO / (60 * 60 * 1000),
    proximaEjecucion: intervalId ? 'Cada ' + (INTERVALO_MANTENIMIENTO / (60 * 60 * 1000)) + ' horas' : 'Sistema detenido',
    configuracion: {
      diasParaEliminacion: 3,
      estadosParaActualizar: ['pendiente', 'confirmada'],
      estadosParaEliminar: ['completada', 'cancelada']
    },
    ultimoMantenimiento: 'Ver logs del servidor'
  });
});

// Ruta para controlar el sistema automático (solo admin)
router.post("/admin/citas/toggle-automatico", verifyToken, isAdmin, (req, res) => {
  try {
    const { accion } = req.body; // 'iniciar' o 'detener'
    
    if (accion === 'iniciar') {
      if (intervalId) {
        return res.json({ message: 'El sistema ya está activo', activo: true });
      }
      iniciarSistemaAutomatico();
      res.json({ message: 'Sistema automático iniciado', activo: true });
      
    } else if (accion === 'detener') {
      if (!intervalId) {
        return res.json({ message: 'El sistema ya está detenido', activo: false });
      }
      detenerSistemaAutomatico();
      res.json({ message: 'Sistema automático detenido', activo: false });
      
    } else {
      res.status(400).json({ error: 'Acción inválida. Use "iniciar" o "detener"' });
    }
    
  } catch (error) {
    console.error('Error controlando sistema automático:', error);
    res.status(500).json({ error: 'Error al controlar sistema automático' });
  }
});

/* ======================
   Dashboard Admin
   ====================== */
router.get("/admin/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const [totalUsuarios, totalProductos, totalMascotas, totalCitas, totalCarritos] = await Promise.all([
      User.countDocuments(),
      Producto.countDocuments(),
      Mascota.countDocuments(),
      Cita.countDocuments(),
      Cart.countDocuments(),
    ]);

    // Estadísticas adicionales de citas
    const citasPorEstado = await Cita.aggregate([
      {
        $group: {
          _id: "$estado",
          count: { $sum: 1 }
        }
      }
    ]);

    const citasHoy = await Cita.countDocuments({
      fecha: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    // Estadísticas de productos
    const productosConDescuento = await Producto.countDocuments({ "descuento.tiene": true });
    const productosConGarantia = await Producto.countDocuments({ "garantia.tiene": true });
    const productosEnvioGratis = await Producto.countDocuments({ envioGratis: true });

    // Estadísticas de carritos
    const carritoStats = await Cart.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: "$itemCount" },
          valorTotal: { $sum: "$total" },
          promedioItems: { $avg: "$itemCount" },
          promedioValor: { $avg: "$total" }
        }
      }
    ]);

    res.json({ 
      totalUsuarios, 
      totalProductos, 
      totalMascotas, 
      totalCitas,
      totalCarritos,
      citasPorEstado,
      citasHoy,
      productosConDescuento,
      productosConGarantia,
      productosEnvioGratis,
      carritoStats: carritoStats[0] || {
        totalItems: 0,
        valorTotal: 0,
        promedioItems: 0,
        promedioValor: 0
      }
    });
  } catch (error) {
    console.error("Error en dashboard:", error);
    res.status(500).json({ error: "Error al obtener datos del dashboard" });
  }
});

/* ======================
   PRODUCTOS ACTUALIZADOS CON NUEVOS CAMPOS
   ====================== */
router.post("/productos", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const { 
      nombre, 
      descripcion, 
      precio, 
      categoria,
      stock,
      // Campos de descuento
      tieneDescuento,
      porcentajeDescuento,
      fechaInicioDescuento,
      fechaFinDescuento,
      // Campos de garantía
      tieneGarantia,
      mesesGarantia,
      descripcionGarantia,
      // Envío gratis
      envioGratis
    } = req.body;

    console.log('📦 Datos recibidos para nuevo producto:', req.body);

    // Preparar objeto de producto
    const datosProducto = {
      nombre: nombre?.trim(),
      descripcion: descripcion?.trim(),
      precio: parseFloat(precio),
      categoria: categoria || 'otros',
      stock: parseInt(stock) || 0,
      envioGratis: envioGratis === 'true' || envioGratis === true,
      descuento: {
        tiene: tieneDescuento === 'true' || tieneDescuento === true,
        porcentaje: parseFloat(porcentajeDescuento) || 0,
        fechaInicio: fechaInicioDescuento ? new Date(fechaInicioDescuento) : null,
        fechaFin: fechaFinDescuento ? new Date(fechaFinDescuento) : null
      },
      garantia: {
        tiene: tieneGarantia === 'true' || tieneGarantia === true,
        meses: parseInt(mesesGarantia) || 0,
        descripcion: descripcionGarantia?.trim() || ""
      }
    };

    // Validar datos del producto
    const validacion = validarProducto(datosProducto);
    if (!validacion.valido) {
      return res.status(400).json({ error: validacion.mensaje });
    }

    const nuevoProducto = new Producto({
      ...datosProducto,
      imagen: req.file
        ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
        : "",
      usuario: req.user.id,
    });

    await nuevoProducto.save();
    console.log('✅ Producto creado exitosamente:', nuevoProducto.nombre);
    
    res.status(201).json({ 
      msg: "Producto creado exitosamente", 
      producto: nuevoProducto 
    });
  } catch (err) {
    console.error("❌ Error creando producto:", err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      res.status(400).json({ msg: "Error de validación", errors });
    } else {
      res.status(500).json({ msg: "Error al crear producto", error: err.message });
    }
  }
});

// Listar productos con información completa
router.get("/productos", async (req, res) => {
  try {
    const { categoria, descuento, garantia, envioGratis } = req.query;
    
    let filtros = { activo: true };
    
    // Aplicar filtros
    if (categoria && categoria !== 'todos') {
      filtros.categoria = categoria;
    }
    
    if (descuento === 'true') {
      filtros['descuento.tiene'] = true;
    }
    
    if (garantia === 'true') {
      filtros['garantia.tiene'] = true;
    }
    
    if (envioGratis === 'true') {
      filtros.envioGratis = true;
    }

    const productos = await Producto.find(filtros).populate("usuario", "name email telefono");

    const productosConDatos = productos.map((p) => {
      const producto = p.toObject();
      
      // Agregar información calculada
      producto.precioConDescuento = p.getPrecioConDescuento();
      producto.descuentoVigente = p.isDescuentoVigente();
      producto.ahorroDescuento = producto.precio - producto.precioConDescuento;
      
      // Formatear imagen
      producto.imagen = p.imagen
        ? p.imagen.startsWith("http")
          ? p.imagen
          : `${req.protocol}://${req.get("host")}${p.imagen}`
        : null;
      
      return producto;
    });

    res.json(productosConDatos);
  } catch (err) {
    console.error("❌ Error listando productos:", err);
    res.status(500).json({ msg: "Error al listar productos", error: err.message });
  }
});

router.get("/productos/:id", async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id).populate("usuario", "name email telefono");
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    
    const productoObj = producto.toObject();
    
    // Agregar información calculada
    productoObj.precioConDescuento = producto.getPrecioConDescuento();
    productoObj.descuentoVigente = producto.isDescuentoVigente();
    productoObj.ahorroDescuento = productoObj.precio - productoObj.precioConDescuento;
    
    // Formatear imagen
    productoObj.imagen = producto.imagen
      ? producto.imagen.startsWith("http")
        ? producto.imagen
        : `${req.protocol}://${req.get("host")}${producto.imagen}`
      : null;
    
    res.json(productoObj);
  } catch (err) {
    console.error("❌ Error obteniendo producto:", err);
    res.status(500).json({ msg: "Error al obtener producto", error: err.message });
  }
});

// Actualizar producto
router.put("/productos/:id", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

    if (req.user.role !== "admin" && producto.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para eliminar este producto" });
    }

    const { 
      nombre, 
      descripcion, 
      precio, 
      categoria,
      stock,
      tieneDescuento,
      porcentajeDescuento,
      fechaInicioDescuento,
      fechaFinDescuento,
      tieneGarantia,
      mesesGarantia,
      descripcionGarantia,
      envioGratis,
      activo
    } = req.body;

    // Actualizar campos básicos
    if (nombre && nombre.trim()) producto.nombre = nombre.trim();
    if (descripcion && descripcion.trim()) producto.descripcion = descripcion.trim();
    if (precio !== undefined) producto.precio = parseFloat(precio);
    if (categoria) producto.categoria = categoria;
    if (stock !== undefined) producto.stock = parseInt(stock);
    if (envioGratis !== undefined) producto.envioGratis = envioGratis === 'true' || envioGratis === true;
    if (activo !== undefined) producto.activo = activo === 'true' || activo === true;

    // Actualizar descuento
    if (tieneDescuento !== undefined) {
      producto.descuento.tiene = tieneDescuento === 'true' || tieneDescuento === true;
      if (producto.descuento.tiene) {
        if (porcentajeDescuento !== undefined) producto.descuento.porcentaje = parseFloat(porcentajeDescuento);
        if (fechaInicioDescuento) producto.descuento.fechaInicio = new Date(fechaInicioDescuento);
        if (fechaFinDescuento) producto.descuento.fechaFin = new Date(fechaFinDescuento);
      } else {
        producto.descuento.porcentaje = 0;
        producto.descuento.fechaInicio = null;
        producto.descuento.fechaFin = null;
      }
    }

    // Actualizar garantía
    if (tieneGarantia !== undefined) {
      producto.garantia.tiene = tieneGarantia === 'true' || tieneGarantia === true;
      if (producto.garantia.tiene) {
        if (mesesGarantia !== undefined) producto.garantia.meses = parseInt(mesesGarantia);
        if (descripcionGarantia !== undefined) producto.garantia.descripcion = descripcionGarantia.trim();
      } else {
        producto.garantia.meses = 0;
        producto.garantia.descripcion = "";
      }
    }

    // Actualizar imagen si se proporciona
    if (req.file) {
      producto.imagen = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    // Validar antes de guardar
    const datosValidacion = {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      descuento: producto.descuento,
      garantia: producto.garantia,
      categoria: producto.categoria,
      stock: producto.stock
    };

    const validacion = validarProducto(datosValidacion);
    if (!validacion.valido) {
      return res.status(400).json({ error: validacion.mensaje });
    }

    await producto.save();
    res.json({ msg: "Producto actualizado correctamente", producto });
  } catch (err) {
    console.error("❌ Error actualizando producto:", err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      res.status(400).json({ msg: "Error de validación", errors });
    } else {
      res.status(500).json({ msg: "Error al actualizar producto", error: err.message });
    }
  }
});

router.delete("/productos/:id", verifyToken, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

    if (req.user.role !== "admin" && producto.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para eliminar este producto" });
    }

    await producto.deleteOne();
    console.log('🗑️ Producto eliminado:', producto.nombre);
    res.json({ msg: "Producto eliminado exitosamente" });
  } catch (err) {
    console.error("❌ Error eliminando producto:", err);
    res.status(500).json({ msg: "Error al eliminar producto", error: err.message });
  }
});

// Obtener categorías disponibles
router.get("/productos/categorias/disponibles", async (req, res) => {
  try {
    const categorias = [
      { value: 'alimento', label: 'Alimento' },
      { value: 'juguetes', label: 'Juguetes' },
      { value: 'medicamentos', label: 'Medicamentos' },
      { value: 'accesorios', label: 'Accesorios' },
      { value: 'higiene', label: 'Higiene' },
      { value: 'otros', label: 'Otros' }
    ];
    
    res.json(categorias);
  } catch (err) {
    console.error("❌ Error obteniendo categorías:", err);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

/* ======================
   Rutas adicionales para admin - Gestión de citas
   ====================== */

// Obtener todas las citas (solo admin)
router.get("/admin/citas", verifyToken, isAdmin, async (req, res) => {
  try {
    const { fecha, estado, tipo } = req.query;
    let query = {};

    // Filtros opcionales
    if (fecha) {
      const fechaNormalizada = normalizarFecha(fecha);
      query.fecha = fechaNormalizada;
    }

    if (estado) {
      query.estado = estado;
    }

    if (tipo) {
      query.tipo = tipo;
    }

    const citas = await Cita.find(query)
      .populate('mascota', 'nombre especie raza imagen')
      .populate('usuario', 'name email telefono')
      .sort({ fecha: 1, hora: 1 });

    res.json(citas);
  } catch (err) {
    console.error("Error obteniendo citas admin:", err);
    res.status(500).json({ error: "Error al obtener citas" });
  }
});

// Obtener cita específica (admin o dueño)
router.get("/citas/:id", verifyToken, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id)
      .populate('mascota', 'nombre especie raza imagen usuario')
      .populate('usuario', 'name email telefono');

    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    // Verificar permisos
    if (req.user.role !== "admin" && cita.usuario._id.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para ver esta cita" });
    }

    res.json(cita);
  } catch (err) {
    console.error("Error obteniendo cita:", err);
    res.status(500).json({ error: "Error al obtener cita" });
  }
});

// Actualizar cita completa (admin o dueño antes de que sea confirmada)
router.put("/citas/:id", verifyToken, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    // Solo admin o dueño pueden modificar
    if (req.user.role !== "admin" && cita.usuario.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para modificar esta cita" });
    }

    // Los usuarios solo pueden modificar citas pendientes
    if (req.user.role !== "admin" && cita.estado !== "pendiente") {
      return res.status(400).json({ error: "Solo se pueden modificar citas pendientes" });
    }

    const { tipo, fecha, hora, motivo, notas } = req.body;

    // Validar nuevos datos si se proporcionan
    if (fecha && !esFechaValida(fecha)) {
      return res.status(400).json({ 
        error: "Fecha inválida. No se pueden agendar citas en el pasado o los domingos" 
      });
    }

    if (hora && !esHorarioValido(hora)) {
      return res.status(400).json({ 
        error: "Horario inválido. Los horarios de atención son: 7:00AM-12:00PM y 2:00PM-6:00PM" 
      });
    }

    // Verificar disponibilidad si cambia fecha u hora
    if ((fecha && fecha !== cita.fecha.toISOString().split('T')[0]) || 
        (hora && hora !== cita.hora)) {
      const fechaNormalizada = fecha ? normalizarFecha(fecha) : cita.fecha;
      const citaExistente = await Cita.findOne({ 
        fecha: fechaNormalizada, 
        hora: hora || cita.hora,
        _id: { $ne: cita._id }
      });
      
      if (citaExistente) {
        return res.status(400).json({ 
          error: "Ya existe una cita agendada para esa fecha y hora" 
        });
      }
    }

    // Actualizar campos
    if (tipo) cita.tipo = tipo;
    if (fecha) cita.fecha = normalizarFecha(fecha);
    if (hora) cita.hora = hora;
    if (motivo) cita.motivo = motivo.trim();
    if (notas !== undefined) cita.notas = notas.trim();

    await cita.save();
    
    await cita.populate([
      { path: 'mascota', select: 'nombre especie raza' },
      { path: 'usuario', select: 'name email telefono' }
    ]);

    res.json({ 
      message: "Cita actualizada exitosamente",
      cita 
    });

  } catch (err) {
    console.error("Error actualizando cita:", err);
    res.status(500).json({ error: "Error al actualizar cita" });
  }
});

// Obtener estadísticas de citas por fecha (admin)
router.get("/admin/citas/estadisticas", verifyToken, isAdmin, async (req, res) => {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    const estadisticas = await Cita.aggregate([
      {
        $match: {
          fecha: { $gte: inicioMes, $lte: finMes }
        }
      },
      {
        $group: {
          _id: {
            dia: { $dayOfMonth: "$fecha" },
            estado: "$estado"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.dia",
          estados: {
            $push: {
              estado: "$_id.estado",
              count: "$count"
            }
          },
          total: { $sum: "$count" }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    res.json({
      mes: hoy.getMonth() + 1,
      año: hoy.getFullYear(),
      estadisticas
    });

  } catch (err) {
    console.error("Error obteniendo estadísticas:", err);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

/* ======================
   📧 Salud - ACTUALIZADA
   ====================== */
router.get("/health", (req, res) => {
  console.log('🩺 Health check solicitado');
  res.json({ 
    ok: true, 
    message: "🩺 Servidor veterinario funcionando correctamente con verificación de email, carrito persistente y sistema automático de citas",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado',
    emailService: transporter ? 'Configurado' : 'No configurado',
    sistemaAutomaticoCitas: intervalId ? 'Activo' : 'Inactivo',
    frontendUrl: FRONTEND_URL,
    backendUrl: BACKEND_URL,
    features: [
      '📧 Verificación de email',
      '🛒 Carrito persistente',
      '🐾 Gestión de mascotas',
      '📅 Sistema de citas',
      '🤖 Gestión automática de citas',
      '📦 Catálogo de productos',
      '🔐 Autenticación Google OAuth'
    ]
  });
});

/* ======================
   Montar rutas
   ====================== */
// 1. Servir archivos estáticos de React (build)
const buildPath = path.join(__dirname, "../client/build"); // Ajusta la ruta según tu estructura
app.use(express.static(buildPath));

// 2. CATCH-ALL: Redirigir todas las rutas no-API a index.html de React
app.get("*", (req, res) => {
  // Solo redirigir si NO es una ruta de API
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(buildPath, "index.html"));
  }
});

/* ======================
   Manejo de errores global
   ====================== */
app.use((err, req, res, next) => {
  console.error("❌ Error no manejado:", err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB.' });
    }
  }
  
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Manejar cierre graceful del servidor
process.on('SIGINT', () => {
  console.log('\n🛑 Recibida señal SIGINT. Cerrando servidor...');
  detenerSistemaAutomatico();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recibida señal SIGTERM. Cerrando servidor...');
  detenerSistemaAutomatico();
  process.exit(0);
});

/* ======================
   📧 Servidor - ACTUALIZADO CON SISTEMA AUTOMÁTICO
   ====================== */
app.listen(PORT, () => {
  console.log("🚀=======================================");
  console.log(`🩺 Servidor Veterinario corriendo en:`);
  console.log(`📍 ${BACKEND_URL}`);
  console.log(`🔗 API disponible en: ${BACKEND_URL}/api`);
  console.log("🩺 Endpoints principales:");
  console.log("   • Salud: GET /api/health");
  console.log("   • Registro: POST /api/register (📧 CON VERIFICACIÓN EMAIL)");
  console.log("   • Verificar Email: GET /api/verify-email/:token");
  console.log("   • Reenviar Verificación: POST /api/resend-verification");
  console.log("   • Login: POST /api/login (📧 VERIFICA EMAIL)");
  console.log("   • Estado Email: GET /api/email/status (ADMIN)");
  console.log("   • Actualizar Perfil: PUT /api/usuarios/perfil");
  console.log("   • Mascotas: GET/POST /api/mascotas");
  console.log("   • Citas: GET/POST /api/citas");
  console.log("   • Horarios: GET /api/citas/horarios-disponibles/:fecha");
  console.log("   • Admin Dashboard: GET /api/admin/dashboard");
  console.log("   • Productos: GET/POST/PUT/DELETE /api/productos");
  console.log("   • Categorías: GET /api/productos/categorias/disponibles");
  console.log("🛒 SISTEMA DE CARRITO PERSISTENTE ACTIVADO:");
  console.log("   • Obtener carrito: GET /api/cart/:userId");
  console.log("   • Guardar carrito: POST /api/cart");
  console.log("   • Limpiar carrito: DELETE /api/cart/:userId");
  console.log("   • Agregar item: PUT /api/cart/item");
  console.log("   • Eliminar item: DELETE /api/cart/item/:userId/:productId");
  console.log("   • Actualizar cantidad: PUT /api/cart/quantity");
  console.log("   • Carritos se guardan automáticamente para usuarios registrados");
  console.log("   • Carritos se borran para usuarios no registrados");
  console.log("   • Sincronización en tiempo real con frontend");
  console.log("🔐 Autenticación con Google configurada:");
  console.log("   • POST /api/auth/google - Autenticar con Google");
  console.log("   • POST /api/auth/google/link - Vincular cuenta Google");
  console.log("   • DELETE /api/auth/google/unlink - Desvincular Google");
  console.log("   • Google Client ID:", GOOGLE_CLIENT_ID);
  console.log("📧 SISTEMA DE VERIFICACIÓN POR EMAIL ACTIVO:");
  console.log("   • Registro tradicional requiere verificación de email");
  console.log("   • Usuarios de Google automáticamente verificados");
  console.log("   • Emails HTML profesionales con plantilla personalizada");
  console.log("   • Tokens seguros con expiración de 24 horas");
  console.log("   • Reenvío de verificación disponible");
  console.log("   • Login bloqueado hasta verificar email");
  console.log("   • Rate limiting: 1 email por minuto por dirección");
  console.log("   • Limpieza automática de tokens expirados cada hora");
  console.log("   • Middleware de verificación en rutas críticas");
  console.log("   • Endpoint de estado del servicio para admin");
  console.log("   • Google reCAPTCHA v3 integrado en registro y login");
  console.log(`📧 URLs configuradas: Frontend=${FRONTEND_URL}, Backend=${BACKEND_URL}`);
  console.log("🤖 SISTEMA AUTOMÁTICO DE CITAS CONFIGURADO:");
  console.log("   • Actualización automática de estados cada 2 horas");
  console.log("   • Eliminación de citas antiguas (>3 días)");
  console.log("   • Endpoints de administración:");
  console.log("     - POST /api/admin/citas/mantenimiento - Ejecutar manual");
  console.log("     - GET /api/admin/citas/estadisticas-mantenimiento - Ver stats");
  console.log("     - GET /api/admin/citas/config-automatico - Ver config");
  console.log("     - POST /api/admin/citas/toggle-automatico - Controlar sistema");
  console.log("   • Estados automáticos:");
  console.log("     - pendiente/confirmada → completada (al pasar fecha/hora)");
  console.log("     - completada/cancelada → eliminadas (después de 3 días)");
  console.log("   • Logs detallados en consola del servidor");
  console.log("💾 MONGODB: Modelos actualizados con esquema de carrito persistente");
  console.log("🔄 SINCRONIZACIÓN: Carrito se sincroniza automáticamente entre dispositivos");
  console.log("=======================================🚀");
});