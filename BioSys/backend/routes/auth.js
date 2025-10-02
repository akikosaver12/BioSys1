import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = "clave_secreta_super_segura";

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

// 🔹 Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({ msg: "Login exitoso", token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ msg: "Error en el servidor" });
  }
});

export default router;
