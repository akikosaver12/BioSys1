import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

function EditarMascota() {
  const { idMascota } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormState>({
    nombre: "",
    especie: "",
    raza: "",
    edad: "",
    genero: "",
    estado: "",
    imagen: null,
  });

  const [imagenActual, setImagenActual] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar datos de la mascota
  useEffect(() => {
    const fetchMascota = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/mascotas/${idMascota}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) throw new Error("Error cargando mascota");
        const data = await res.json();

        setFormData({
          nombre: data.nombre || "",
          especie: data.especie || "",
          raza: data.raza || "",
          edad: data.edad?.toString() || "",
          genero: data.genero || "",
          estado: data.estado || "",
          imagen: null,
        });
        setImagenActual(data.imagen || "");
      } catch (err) {
        console.error("Error al cargar mascota:", err);
        alert("No se pudo cargar la mascota.");
      } finally {
        setLoading(false);
      }
    };

    if (idMascota) fetchMascota();
  }, [idMascota]);

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData((prev) => ({ ...prev, imagen: e.target.files![0] }));
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setFormData((prev) => ({ ...prev, imagen: file }));
      }
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, imagen: null }));
    setImagenActual("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, value as any);
      });

      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/mascotas/${idMascota}`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al actualizar");

      alert("Mascota actualizada correctamente");
      navigate("/mascotas");
    } catch (err) {
      console.error("Error al actualizar:", err);
      alert("No se pudo actualizar la mascota.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Cargando datos de la mascota...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Editar Mascota
          </h1>
          <p className="text-lg text-gray-600">
            Actualiza la información de la mascota seleccionada
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-lime-400 to-lime-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Imagen */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <div
              className={`w-48 h-48 rounded-full border-4 border-dashed transition-all duration-300 overflow-hidden ${
                dragActive
                  ? "border-lime-400 bg-lime-50 scale-105"
                  : formData.imagen || imagenActual
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
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : imagenActual ? (
                <img
                  src={imagenActual}
                  alt="Imagen actual"
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

            {/* Botón Upload/Edit */}
            <label
              htmlFor="imagen"
              className="absolute bottom-4 right-4 bg-lime-400 hover:bg-lime-500 text-black p-4 rounded-full cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 border-4 border-white"
            >
              {formData.imagen || imagenActual ? (
                <Upload size={20} />
              ) : (
                <Camera size={20} />
              )}
            </label>

            {/* Remove Button */}
            {(formData.imagen || imagenActual) && (
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
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Nombre */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200 text-lg"
                  placeholder="Ej: Max, Luna, Rocky..."
                />
              </div>

              {/* Edad */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Edad
                </label>
                <input
                  type="number"
                  name="edad"
                  value={formData.edad}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200 text-lg"
                  min="0"
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
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 text-lg bg-white"
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
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 text-lg"
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
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 text-lg bg-white"
                >
                  <option value="">Seleccionar género</option>
                  <option value="Macho">♂️ Macho</option>
                  <option value="Hembra">♀️ Hembra</option>
                </select>
              </div>

              {/* Estado */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 text-lg bg-white"
                >
                  <option value="">Seleccionar estado</option>
                  <option value="Disponible">✅ Disponible</option>
                  <option value="En proceso">⏳ En proceso</option>
                  <option value="Adoptado">❤️ Adoptado</option>
                </select>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-center gap-6 mt-10">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-black font-bold py-5 px-12 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 flex items-center gap-4 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check size={24} /> Guardar cambios
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/mascotas")}
                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-5 px-12 rounded-2xl transition-all duration-300 shadow-md text-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditarMascota;
