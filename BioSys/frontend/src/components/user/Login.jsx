import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const navigate = useNavigate();

  // 👉 Actualiza inputs
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 👉 Maneja login tradicional - ACTUALIZADO PARA VERIFICACIÓN
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowVerificationMessage(false);

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("🔹 Respuesta backend:", data);

      if (res.ok) {
        // Login exitoso
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("✅ Bienvenido " + data.user.name);

        // 👉 Redirigir según rol
        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      } else {
        // Manejar diferentes tipos de errores
        if (data.requiereVerificacion) {
          // Usuario no ha verificado su email
          setShowVerificationMessage(true);
          setPendingEmail(data.email);
        } else {
          alert("❌ " + (data.error || "Credenciales incorrectas"));
        }
      }
    } catch (error) {
      console.error("⚠️ Error de conexión:", error);
      alert("⚠️ No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

  // 👉 Maneja login con Google
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credentialResponse.credential
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("✅ Bienvenido " + data.user.name);

        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      } else {
        alert("❌ " + (data.error || "Error en autenticación con Google"));
      }
    } catch (error) {
      console.error("⚠️ Error Google login:", error);
      alert("⚠️ Error al iniciar sesión con Google");
    }
  };

  const handleGoogleError = () => {
    alert("❌ Error al iniciar sesión con Google");
  };

  // 👉 Función para reenviar verificación
  const reenviarVerificacion = async () => {
    if (!pendingEmail) return;

    try {
      const res = await fetch("http://localhost:5000/api/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: pendingEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Email de verificación reenviado. Revisa tu bandeja de entrada.");
      } else {
        alert("❌ " + (data.error || "Error al reenviar email"));
      }
    } catch (error) {
      alert("❌ Error al reenviar email de verificación");
    }
  };

  // 👉 Ir a página de verificación pendiente
  const irAVerificacionPendiente = () => {
    navigate("/verificacion-pendiente", {
      state: { 
        email: pendingEmail,
        mensaje: "Debes verificar tu email antes de iniciar sesión" 
      }
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-purple-700">
          Iniciar Sesión
        </h2>

        {/* 📧 Mensaje de verificación pendiente */}
        {showVerificationMessage && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                  Email no verificado
                </h3>
                <p className="text-sm text-yellow-700 mb-3">
                  Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada para <strong>{pendingEmail}</strong>
                </p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={irAVerificacionPendiente}
                    className="w-full text-sm bg-yellow-600 text-white py-2 px-3 rounded hover:bg-yellow-700 transition"
                  >
                    Ver instrucciones de verificación
                  </button>
                  <button
                    type="button"
                    onClick={reenviarVerificacion}
                    className="w-full text-sm border border-yellow-600 text-yellow-600 py-2 px-3 rounded hover:bg-yellow-50 transition"
                  >
                    Reenviar email de verificación
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            width="100%"
          />
        </div>

        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-purple-500"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-purple-500"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <p className="text-sm text-center mt-4">
          ¿No tienes cuenta?{" "}
          <span
            className="text-purple-600 cursor-pointer font-semibold"
            onClick={() => navigate("/registro")}
          >
            Regístrate
          </span>
        </p>
      </form>
    </div>
  );
}

export default Login;