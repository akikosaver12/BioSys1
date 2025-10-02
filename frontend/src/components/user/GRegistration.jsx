import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const CompleteGoogleRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Datos del usuario de Google
  const [googleUser, setGoogleUser] = useState(null);
  const [credential, setCredential] = useState(null);

  // Datos del formulario
  const [formData, setFormData] = useState({
    telefono: "",
    direccion: {
      calle: "",
      ciudad: "",
      estado: "",
      pais: "Colombia",
    },
  });

  // Verificar si tenemos los datos necesarios del estado de navegación
  useEffect(() => {
    if (location.state && location.state.googleUser && location.state.credential) {
      setGoogleUser(location.state.googleUser);
      setCredential(location.state.credential);
    } else {
      // Si no hay datos de Google, redirigir al registro
      console.log("No se encontraron datos de Google, redirigiendo...");
      navigate("/register");
    }
  }, [location.state, navigate]);

  // Validar teléfono en tiempo real
  const validarTelefono = (telefono) => {
    const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, "");
    return /^\+?[\d]{7,15}$/.test(telefonoLimpio);
  };

  // Manejar cambios en inputs normales
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar errores cuando el usuario modifica el campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Manejar cambios en campos de dirección
  const handleDireccionChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      direccion: {
        ...prev.direccion,
        [name]: value,
      },
    }));

    // Limpiar errores de dirección
    if (errors[`direccion.${name}`]) {
      setErrors((prev) => ({
        ...prev,
        [`direccion.${name}`]: "",
      }));
    }
  };

  // Validar formulario
  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validar teléfono
    if (!formData.telefono.trim()) {
      nuevosErrores.telefono = "El teléfono es obligatorio";
    } else if (!validarTelefono(formData.telefono)) {
      nuevosErrores.telefono = "El teléfono debe tener un formato válido (7-15 dígitos)";
    }

    // Validar dirección
    if (!formData.direccion.calle.trim()) {
      nuevosErrores["direccion.calle"] = "La dirección es obligatoria";
    } else if (formData.direccion.calle.trim().length < 5) {
      nuevosErrores["direccion.calle"] = "La dirección debe tener al menos 5 caracteres";
    }

    if (!formData.direccion.ciudad.trim()) {
      nuevosErrores["direccion.ciudad"] = "La ciudad es obligatoria";
    } else if (formData.direccion.ciudad.trim().length < 2) {
      nuevosErrores["direccion.ciudad"] = "La ciudad debe tener al menos 2 caracteres";
    }

    if (!formData.direccion.estado.trim()) {
      nuevosErrores["direccion.estado"] = "El departamento/estado es obligatorio";
    } else if (formData.direccion.estado.trim().length < 2) {
      nuevosErrores["direccion.estado"] = "El estado debe tener al menos 2 caracteres";
    }

    return nuevosErrores;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🔄 Completando registro de Google...");

    const erroresValidacion = validarFormulario();
    if (Object.keys(erroresValidacion).length > 0) {
      console.log("❌ Errores de validación:", erroresValidacion);
      setErrors(erroresValidacion);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log("📤 Enviando datos adicionales al servidor...");
      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credential,
          userData: {
            telefono: formData.telefono,
            direccion: formData.direccion,
          },
        }),
      });

      const data = await res.json();
      console.log("📥 Respuesta del servidor:", data);

      if (res.ok) {
        // Guardar token y datos del usuario
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        console.log("✅ Registro completado exitosamente!");
        alert("✅ ¡Registro completado! Bienvenido a la clínica veterinaria");
        
        // Redirigir a la página principal
        navigate(data.redirectTo || "/home");
      } else {
        console.log("❌ Error completando el registro:", data);
        alert("❌ " + (data.error || "Error al completar el registro"));
      }
    } catch (error) {
      console.error("💥 Error de conexión:", error);
      alert("⚠️ Error de conexión con el servidor. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Cancelar y volver al registro
  const handleCancel = () => {
    navigate("/register");
  };

  // Si no hay datos de Google, mostrar loading
  if (!googleUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              {googleUser.picture && (
                <img
                  src={googleUser.picture}
                  alt="Profile"
                  className="w-16 h-16 rounded-full mx-auto mb-3"
                />
              )}
              <h2 className="text-3xl font-bold text-purple-700 mb-2">
                ¡Hola, {googleUser.name}!
              </h2>
              <p className="text-gray-600">
                Completa tu información para finalizar el registro
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Email:</span> {googleUser.email}
              </p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="telefono"
                  placeholder="Ej: +57 301 234 5678 o 3012345678"
                  value={formData.telefono}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition ${
                    errors.telefono ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.telefono && (
                  <p className="text-red-600 text-sm mt-1">{errors.telefono}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Formato: números con o sin código de país
                </p>
              </div>

              {/* Sección de Dirección */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                  Dirección de Residencia
                </h3>

                {/* Dirección Completa */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección Completa *
                  </label>
                  <input
                    type="text"
                    name="calle"
                    placeholder="Ej: Calle 123 #45-67, Barrio Centro"
                    value={formData.direccion.calle}
                    onChange={handleDireccionChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition ${
                      errors['direccion.calle'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors['direccion.calle'] && (
                    <p className="text-red-600 text-sm mt-1">{errors['direccion.calle']}</p>
                  )}
                </div>

                {/* Ciudad */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    placeholder="Ej: Barranquilla"
                    value={formData.direccion.ciudad}
                    onChange={handleDireccionChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition ${
                      errors['direccion.ciudad'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors['direccion.ciudad'] && (
                    <p className="text-red-600 text-sm mt-1">{errors['direccion.ciudad']}</p>
                  )}
                </div>

                {/* Departamento/Estado */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento/Estado *
                  </label>
                  <input
                    type="text"
                    name="estado"
                    placeholder="Ej: Atlántico"
                    value={formData.direccion.estado}
                    onChange={handleDireccionChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition ${
                      errors['direccion.estado'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors['direccion.estado'] && (
                    <p className="text-red-600 text-sm mt-1">{errors['direccion.estado']}</p>
                  )}
                </div>

                {/* País */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País
                  </label>
                  <select
                    name="pais"
                    value={formData.direccion.pais}
                    onChange={handleDireccionChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  >
                    <option value="Colombia">Colombia</option>
                    <option value="México">México</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Chile">Chile</option>
                    <option value="Perú">Perú</option>
                    <option value="Venezuela">Venezuela</option>
                    <option value="Ecuador">Ecuador</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="mt-8 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition duration-300 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 hover:transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Completando Registro...
                  </span>
                ) : (
                  'Completar Registro'
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="w-full py-2 px-4 rounded-lg font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>

            {/* Nota informativa */}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">
                <span className="font-semibold">Nota:</span> Esta información nos ayuda a brindarte un mejor servicio 
                personalizado. Todos los campos marcados con (*) son obligatorios.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteGoogleRegistration;