import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, X, Check } from "lucide-react";

interface FormState {
  nombre: string;
  especie: string;
  raza: string;
  edad: string;
  genero: string;
  estado: string;
  imagen: File | null;
}

const CrearMascota: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    nombre: "",
    especie: "",
    raza: "",
    edad: "",
    genero: "",
    estado: "",
    imagen: null,
  });

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({ ...prev, imagen: e.target.files![0] }));
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setFormData((prev) => ({ ...prev, imagen: file }));
      }
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, imagen: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value as any);
    });

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/mascotas", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,

        body: data,
      });

      const json = await res.json();
      if (res.ok) {
        alert("Mascota creada con éxito");
        navigate("/mascotas"); // 👈 Redirige a la página de mascotas
      } else {
        alert("Error: " + JSON.stringify(json));
      }
    } catch (err) {
      console.error("Error de red:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Registrar Nueva Mascota
          </h1>
          <p className="text-lg text-gray-600">
            Completa la información para agregar una nueva mascota
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-lime-400 to-lime-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Profile Photo Section */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <div
              className={`w-48 h-48 rounded-full border-4 border-dashed transition-all duration-300 overflow-hidden ${
                dragActive
                  ? "border-lime-400 bg-lime-50 scale-105"
                  : formData.imagen
                  ? "border-lime-400 bg-white"
                  : "border-gray-300 hover:border-gray-400 bg-gray-50 hover:scale-105"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {formData.imagen ? (
                <img
                  src={URL.createObjectURL(formData.imagen)}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="bg-gray-200 p-4 rounded-full mb-3">
                    <Camera size={40} className="text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    Foto de perfil
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Arrastra o haz clic
                  </p>
                </div>
              )}
            </div>
            
            {/* Upload/Edit Button */}
            <label
              htmlFor="imagen"
              className="absolute bottom-4 right-4 bg-lime-400 hover:bg-lime-500 text-black p-4 rounded-full cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 border-4 border-white"
            >
              {formData.imagen ? (
                <Upload size={20} />
              ) : (
                <Camera size={20} />
              )}
            </label>
            
            {/* Remove Button */}
            {formData.imagen && (
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 border-4 border-white"
              >
                <X size={16} />
              </button>
            )}
            
            <input
              id="imagen"
              type="file"
              name="imagen"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          <form onSubmit={handleSubmit}>
            {/* Basic Info Section */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-8 rounded-2xl border border-gray-100 mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center">
                <div className="w-3 h-3 bg-lime-400 rounded-full mr-4"></div>
                Información Básica
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Nombre */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Nombre de la mascota
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200 text-gray-900 placeholder-gray-400 text-lg"
                    placeholder="Ej: Max, Luna, Rocky..."
                  />
                </div>

                {/* Edad */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Edad (años)
                  </label>
                  <input
                    type="number"
                    name="edad"
                    value={formData.edad}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200 text-gray-900 placeholder-gray-400 text-lg"
                    placeholder="0"
                    min="0"
                    max="30"
                  />
                </div>

                {/* Especie */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Especie
                  </label>
                  <select
                    name="especie"
                    value={formData.especie}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200 text-gray-900 bg-white text-lg"
                  >
                    <option value="">Seleccionar especie</option>
                    <option value="Perro">🐕 Perro</option>
                    <option value="Gato">🐱 Gato</option>
                    <option value="Ave">🦜 Ave</option>
                    <option value="Otro">🐾 Otro</option>
                  </select>
                </div>

                {/* Raza */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Raza
                  </label>
                  <input
                    type="text"
                    name="raza"
                    value={formData.raza}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200 text-gray-900 placeholder-gray-400 text-lg"
                    placeholder="Ej: Labrador, Mestizo, Persa..."
                  />
                </div>

                {/* Género */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Género
                  </label>
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200 text-gray-900 bg-white text-lg"
                  >
                    <option value="">Seleccionar género</option>
                    <option value="Macho">♂️ Macho</option>
                    <option value="Hembra">♀️ Hembra</option>
                  </select>
                </div>

                {/* Estado */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Estado de adopción
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200 text-gray-900 bg-white text-lg"
                  >
                    <option value="">Seleccionar estado</option>
                    <option value="Disponible">✅ Disponible</option>
                    <option value="En proceso">⏳ En proceso</option>
                    <option value="Adoptado">❤️ Adoptado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-black font-bold py-5 px-16 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-4 text-lg ${
                  isSubmitting ? "animate-pulse" : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                    Guardando mascota...
                  </>
                ) : (
                  <>
                    <Check size={24} />
                    Registrar Mascota
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-base mb-2">
            Haz clic en el círculo verde o arrastra una imagen para agregar la foto de perfil
          </p>
          <p className="text-sm text-gray-400">
            Formatos soportados: JPG, PNG, WebP (máx. 5MB)
          </p>
        </div>
      </div>
    </div>
  );
};

export default CrearMascota;