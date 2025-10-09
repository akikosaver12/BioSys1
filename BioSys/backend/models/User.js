import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
    password: { type: String, default: null }, // puede ser null si es Google
  picture: { type: String }, // para foto de perfil de Google
});

export default mongoose.model("User", userSchema);


