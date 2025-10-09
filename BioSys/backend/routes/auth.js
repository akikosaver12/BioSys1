// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = "clave_secreta_super_segura";

// Configuración cliente de Google
const client = new OAuth2Client("TU_GOOGLE_CLIENT_ID");

// 🔹 Registro
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExist = await User.findOne({ email });
    if (userExist) return res.status(400).json({ msg: "El usuario ya existe" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.json({ msg: "Usuario registrado con éxito" });
  } catch (err) {
    res.status(500).json({ msg: "Error en el servidor" });
  }
});

// 🔹 Login normal
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      msg: "Login exitoso",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ msg: "Error en el servidor" });
  }
});

// 🔹 Login con Google
router.post("/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;

    // 1. Verificar el token de Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: "TU_GOOGLE_CLIENT_ID", // el mismo que configuras en Google Cloud
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // 2. Buscar o crear usuario
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        password: null, // no necesita contraseña
        picture,
      });
      await user.save();
    }

    // 3. Generar JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      msg: "Login con Google exitoso",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (err) {
    console.error("Error en Google login:", err);
    res.status(500).json({ msg: "Error en autenticación con Google" });
  }
});

export default router;
