import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// CONSTANTES MEJORADAS - Variables de entorno con fallbacks
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "503963971592-17vo21di0tjf249341l4ocscemath5p0.apps.googleusercontent.com";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    telefono: "",
    direccion: {
      calle: "",
      ciudad: "",
      estado: "",
      pais: "Colombia",
    },
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [googleInitialized, setGoogleInitialized] = useState(false);

  // Debug info en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Configuración del componente Register:');
      console.log('📧 Google Client ID:', GOOGLE_CLIENT_ID);
      console.log('🌐 API URL:', API_URL);
    }
  }, []);

  // Validaciones separadas para mejor rendimiento
  const validarTelefono = useCallback((telefono) => {
    if (!telefono) return false;
    const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, "");
    return /^\+?[\d]{7,15}$/.test(telefonoLimpio);
  }, []);

  const validarEmail = useCallback((email) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  const validarNombre = useCallback((nombre) => {
    if (!nombre) return false;
    return nombre.trim().length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre);
  }, []);

  // Manejar registro con Google - MEJORADO con useCallback
  const handleGoogleSignIn = useCallback(async (response) => {
    setGoogleLoading(true);
    
    try {
      console.log("📧 Iniciando registro con Google...");
      
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: response.credential
        }),
      });

      const data = await res.json();
      console.log("📥 Respuesta Google OAuth:", {
        ...data,
        token: data.token ? '[TOKEN_PRIVADO]' : undefined,
        credential: '[CREDENTIAL_PRIVADO]'
      });

      if (res.ok) {
        if (data.requiresAdditionalInfo) {
          console.log("🆕 Usuario nuevo de Google, redirigiendo a completar registro...");
          navigate("/gregistro", { 
            state: { 
              googleUser: data.googleUser,
              credential: response.credential 
            }
          });
        } else {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          console.log("✅ Login exitoso con Google para:", data.user?.email);
          alert(data.message || "¡Bienvenido de nuevo!");
          navigate(data.redirectTo || "/home");
        }
      } else {
        console.error("❌ Error en Google OAuth:", data);
        
        if (res.status === 401) {
          alert("❌ Token de Google inválido. Por favor, intenta de nuevo.");
        } else if (res.status === 400 && data.error?.includes('email')) {
          alert("❌ " + data.error);
        } else {
          alert("❌ " + (data.error || "Error al registrarse con Google"));
        }
      }
    } catch (error) {
      console.error("💥 Error en registro con Google:", error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert("❌ No se pudo conectar con el servidor para verificar con Google.");
      } else {
        alert("❌ Error al conectar con Google. Intenta de nuevo.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }, [navigate]);

  // Cargar Google Sign-In Script - CORREGIDO con mejor manejo
  useEffect(() => {
    let scriptElement = null;

    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true,
            ux_mode: 'popup',
            context: 'signup',
            use_fedcm_for_prompt: false
          });
          
          console.log('✅ Google Sign-In inicializado correctamente');
          setGoogleInitialized(true);
          
          // Pre-renderizar botón como respaldo
          setTimeout(() => {
            const fallbackDiv = document.getElementById('google-signin-button-fallback');
            if (fallbackDiv && window.google) {
              try {
                window.google.accounts.id.renderButton(fallbackDiv, {
                  theme: 'outline',
                  size: 'large',
                  text: 'signup_with',
                  width: '100%'
                });
              } catch (e) {
                console.warn('Error renderizando botón de respaldo:', e);
              }
            }
          }, 100);
          
        } catch (error) {
          console.error('❌ Error inicializando Google Sign-In:', error);
          setGoogleInitialized(false);
        }
      }
    };

    const loadGoogleScript = () => {
      // Verificar si ya existe el script
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        console.log('✅ Script de Google ya existe');
        if (window.google) {
          setGoogleScriptLoaded(true);
          initializeGoogleSignIn();
        }
        return;
      }

      if (window.google) {
        console.log('✅ Google GSI ya cargado');
        setGoogleScriptLoaded(true);
        initializeGoogleSignIn();
        return;
      }
      
      console.log('🔄 Cargando Google GSI...');
      scriptElement = document.createElement('script');
      scriptElement.src = 'https://accounts.google.com/gsi/client';
      scriptElement.async = true;
      scriptElement.defer = true;
      
      scriptElement.onload = () => {
        console.log('✅ Google GSI script cargado');
        setGoogleScriptLoaded(true);
        initializeGoogleSignIn();
      };
      
      scriptElement.onerror = (error) => {
        console.error('❌ Error cargando Google GSI:', error);
        setGoogleScriptLoaded(false);
      };
      
      document.head.appendChild(scriptElement);
    };

    loadGoogleScript();

    // Cleanup function
    return () => {
      if (scriptElement && scriptElement.parentNode) {
        try {
          scriptElement.parentNode.removeChild(scriptElement);
        } catch (e) {
          console.warn('Error removiendo script:', e);
        }
      }
    };
  }, [handleGoogleSignIn]);

  // Manejar cambios en inputs normales - OPTIMIZADO
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error específico cuando el usuario comience a corregir
    setErrors(prev => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });

    // Validaciones específicas en tiempo real con debounce implícito
    if (value) {
      setTimeout(() => {
        if (name === 'email' && !validarEmail(value)) {
          setErrors(prev => ({ ...prev, email: 'Formato de email inválido' }));
        } else if (name === 'name' && !validarNombre(value)) {
          setErrors(prev => ({ ...prev, name: 'El nombre solo debe contener letras y espacios' }));
        } else if (name === 'telefono' && !validarTelefono(value)) {
          setErrors(prev => ({ ...prev, telefono: 'Formato de teléfono inválido' }));
        }
      }, 500); // Debounce de 500ms
    }
  }, [validarEmail, validarNombre, validarTelefono]);

  // Manejar cambios en campos de dirección - OPTIMIZADO
  const handleDireccionChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      direccion: {
        ...prev.direccion,
        [name]: value,
      },
    }));

    // Limpiar errores
    setErrors(prev => {
      const errorKey = `direccion.${name}`;
      if (prev[errorKey]) {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Validar formulario MEJORADO
  const validarFormulario = useCallback(() => {
    const nuevosErrores = {};

    if (!formData.name.trim()) {
      nuevosErrores.name = "El nombre es obligatorio";
    } else if (!validarNombre(formData.name)) {
      nuevosErrores.name = "El nombre solo debe contener letras y espacios (mín. 2 caracteres)";
    }

    if (!formData.email.trim()) {
      nuevosErrores.email = "El email es obligatorio";
    } else if (!validarEmail(formData.email)) {
      nuevosErrores.email = "El email debe tener un formato válido";
    }

    if (!formData.password) {
      nuevosErrores.password = "La contraseña es obligatoria";
    } else if (formData.password.length < 6) {
      nuevosErrores.password = "La contraseña debe tener al menos 6 caracteres";
    } else if (formData.password.length > 128) {
      nuevosErrores.password = "La contraseña es demasiado larga (máx. 128 caracteres)";
    }

    if (!formData.telefono.trim()) {
      nuevosErrores.telefono = "El teléfono es obligatorio";
    } else if (!validarTelefono(formData.telefono)) {
      nuevosErrores.telefono = "El teléfono debe tener un formato válido (7-15 dígitos)";
    }

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
      nuevosErrores["direccion.estado"] = "El estado/departamento es obligatorio";
    } else if (formData.direccion.estado.trim().length < 2) {
      nuevosErrores["direccion.estado"] = "El estado debe tener al menos 2 caracteres";
    }

    return nuevosErrores;
  }, [formData, validarNombre, validarEmail, validarTelefono]);

  // Manejar el registro tradicional - MEJORADO con mejor manejo de errores
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    console.log("🔄 Iniciando registro con datos:", {
      ...formData,
      password: '[OCULTO]'
    });

    const erroresValidacion = validarFormulario();
    if (Object.keys(erroresValidacion).length > 0) {
      console.log("❌ Errores de validación:", erroresValidacion);
      setErrors(erroresValidacion);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log("📤 Enviando datos al servidor...");
      
      // Timeout para la petición
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      
      console.log("📥 Respuesta del servidor:", {
        ...data,
        email: data.email ? '[EMAIL_PRIVADO]' : undefined
      });

      if (res.ok) {
        console.log("✅ Registro exitoso!");
        
        if (data.requiereVerificacion) {
          navigate("/verificacion-pendiente", { 
            state: { 
              email: data.email,
              mensaje: data.instrucciones 
            }
          });
        } else {
          alert("✅ ¡Registro exitoso! Bienvenido a la clínica veterinaria");
          navigate("/login");
        }
      } else {
        console.log("❌ Error en el registro:", data);
        
        if (res.status === 400) {
          if (data.campos) {
            const erroresServidor = {};
            data.campos.forEach((campo) => {
              erroresServidor[campo] = `${campo} es requerido`;
            });
            setErrors(erroresServidor);
          } else if (data.error) {
            if (data.error.includes('email')) {
              setErrors({ email: data.error });
            } else if (data.error.includes('teléfono') || data.error.includes('telefono')) {
              setErrors({ telefono: data.error });
            } else if (data.error.includes('dirección') || data.error.includes('direccion')) {
              setErrors({ 'direccion.calle': data.error });
            } else {
              alert("❌ " + data.error);
            }
          }
        } else if (res.status === 500) {
          alert("❌ Error interno del servidor. Por favor, intenta de nuevo más tarde.");
        } else {
          alert("❌ " + (data.error || "Error en el registro"));
        }
      }
    } catch (error) {
      console.error("💥 Error de conexión:", error);
      
      if (error.name === 'AbortError') {
        alert("⚠️ La petición tardó demasiado tiempo. Intenta de nuevo.");
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert("⚠️ No se pudo conectar con el servidor. Verifica que esté corriendo en " + API_URL.replace('/api', ''));
      } else {
        alert("⚠️ Error de conexión con el servidor. Por favor, intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }, [formData, validarFormulario, navigate]);

  // Manejar click del botón de Google - MEJORADO
  const handleGoogleButtonClick = useCallback(() => {
    if (!googleScriptLoaded || !googleInitialized) {
      alert("Google Sign-In aún no está disponible. Espera un momento o recarga la página.");
      return;
    }

    if (!window.google || !window.google.accounts) {
      alert("Google Sign-In no está disponible. Recarga la página.");
      return;
    }

    try {
      window.google.accounts.id.prompt((notification) => {
        console.log('Google prompt notification:', notification);
        
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.warn('⚠️ Google prompt no disponible:', notification.getNotDisplayedReason());
          
          const buttonDiv = document.getElementById('google-signin-button-fallback');
          if (buttonDiv) {
            buttonDiv.classList.remove('hidden');
          } else {
            alert('Por favor, recarga la página e intenta de nuevo con Google Sign-In.');
          }
        }
      });
    } catch (error) {
      console.error('❌ Error con Google prompt:', error);
      
      const buttonDiv = document.getElementById('google-signin-button-fallback');
      if (buttonDiv) {
        buttonDiv.classList.remove('hidden');
      }
    }
  }, [googleScriptLoaded, googleInitialized]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-purple-700 mb-2">
              Crear Cuenta
            </h2>
            <p className="text-gray-600">
              Únete a nuestra clínica veterinaria
            </p>
          </div>

          {/* Botón de Google - PARTE SUPERIOR */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleButtonClick}
              disabled={loading || googleLoading || !googleInitialized}
              className={`w-full py-3 rounded-lg transition flex items-center justify-center gap-3 shadow-sm ${
                loading || googleLoading || !googleInitialized
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              {googleLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {googleLoading ? "Registrando con Google..." : 
               !googleInitialized ? "Cargando Google Sign-In..." :
               "Registrarse con Google"}
            </button>
            
            {/* Div oculto para fallback del botón de Google */}
            <div id="google-signin-button-fallback" className="mt-2 hidden"></div>
            
            <p className="text-xs text-center text-gray-500 mt-2">
              Registro rápido y seguro con tu cuenta de Google
            </p>
          </div>

          {/* Separador */}
          <div className="flex items-center mb-6">
            <hr className="flex-1 border-gray-300" />
            <span className="px-3 text-gray-500 text-sm">o completa el formulario</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          {/* Formulario tradicional */}
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  Información Personal
                </h3>
                
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Ej: Juan Pérez"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition ${
                      errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    maxLength="100"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition ${
                      errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    maxLength="254"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Te enviaremos un email para verificar tu cuenta
                  </p>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition ${
                      errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    maxLength="128"
                  />
                  {errors.password && (
                    <p className="text-red-600 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    maxLength="20"
                  />
                  {errors.telefono && (
                    <p className="text-red-600 text-sm mt-1">{errors.telefono}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Formato: números con o sin código de país
                  </p>
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  Dirección de Residencia
                </h3>

                {/* Calle/Dirección */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    maxLength="200"
                  />
                  {errors['direccion.calle'] && (
                    <p className="text-red-600 text-sm mt-1">{errors['direccion.calle']}</p>
                  )}
                </div>

                {/* Ciudad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    maxLength="100"
                  />
                  {errors['direccion.ciudad'] && (
                    <p className="text-red-600 text-sm mt-1">{errors['direccion.ciudad']}</p>
                  )}
                </div>

                {/* Estado/Departamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    maxLength="100"
                  />
                  {errors['direccion.estado'] && (
                    <p className="text-red-600 text-sm mt-1">{errors['direccion.estado']}</p>
                  )}
                </div>

                {/* País */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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

                {/* Espacio adicional para mantener el balance del diseño */}
                <div className="h-16 flex items-center justify-center">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-700 text-sm font-medium">
                      La dirección nos ayuda a brindar un mejor servicio
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="mt-8 space-y-4">
              <button
                type="submit"
                disabled={loading || googleLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition duration-300 ${
                  loading || googleLoading
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
                    Creando cuenta...
                  </span>
                ) : (
                  'Crear Cuenta'
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition"
                  >
                    Inicia Sesión
                  </button>
                </p>
              </div>
            </div>

            {/* Nota de campos obligatorios - ACTUALIZADA */}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">
                <span className="font-semibold">Nota:</span> Los campos marcados con (*) son obligatorios. 
                Después del registro, recibirás un email para verificar tu cuenta antes de poder iniciar sesión.
                Con Google, solo necesitarás agregar tu teléfono y dirección después del registro.
              </p>
            </div>

            {/* Información de debug en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <p><strong>Debug info:</strong></p>
                <p>Google Script: {googleScriptLoaded ? '✅' : '❌'}</p>
                <p>Google Init: {googleInitialized ? '✅' : '❌'}</p>
                <p>API URL: {API_URL}</p>
                <p>Google Client ID: {GOOGLE_CLIENT_ID.substring(0, 20)}...</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;