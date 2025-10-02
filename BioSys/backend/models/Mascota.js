import mongoose from "mongoose";

const mascotaSchema = new mongoose.Schema({
  nombre: String,
  especie: String,  // ← Agregado: faltaba en tu schema original
  estado: String,
  raza: String,
  edad: Number,     // ← Cambiado: de String a Number para consistencia
  genero: String,
  enfermedades: String,
  historial: String,
  imagen: String,
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true }); // ← Agregado: para createdAt y updatedAt

export default mongoose.model("Mascota", mascotaSchema);