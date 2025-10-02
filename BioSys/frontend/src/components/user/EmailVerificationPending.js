// 📧 EmailVerificationPending.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const EmailVerificationPending = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  
  // Obtener email del state de navegación
  const email = location.state?.email || 'tu correo';

  const reenviarVerificacion = async () => {
    setLoading(true);
    setMensaje('');

    try {
      const res = await fetch('http://localhost:5000/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje('✅ Email de verificación reenviado exitosamente');
      } else {
        setMensaje(`❌ ${data.error}`);
      }
    } catch (error) {
      setMensaje('❌ Error al reenviar email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          {/* Icono de email */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-purple-700 mb-2">
              Verifica tu correo electrónico
            </h2>
          </div>

          {/* Mensaje principal */}
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Hemos enviado un email de verificación a:
            </p>
            <p className="font-semibold text-purple-700 bg-purple-50 p-3 rounded-lg mb-4">
              {email}
            </p>
            <p className="text-sm text-gray-500">
              Revisa tu bandeja de entrada y haz clic en el enlace "Sí, este es mi correo" para activar tu cuenta.
            </p>
          </div>

          {/* Instrucciones */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">¿No encuentras el email?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Revisa tu carpeta de spam/correo no deseado</li>
              <li>• Verifica que el email esté escrito correctamente</li>
              <li>• El enlace expira en 24 horas</li>
            </ul>
          </div>

          {/* Mensaje de estado */}
          {mensaje && (
            <div className={`p-3 rounded-lg mb-4 ${
              mensaje.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {mensaje}
            </div>
          )}

          {/* Botones */}
          <div className="space-y-3">
            <button
              onClick={reenviarVerificacion}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Reenviando...
                </>
              ) : (
                'Reenviar email de verificación'
              )}
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full border border-purple-600 text-purple-600 py-3 rounded-lg hover:bg-purple-50 transition"
            >
              Ir a iniciar sesión
            </button>

            <button
              onClick={() => navigate('/registro')}
              className="w-full text-gray-500 py-2 hover:text-gray-700 transition text-sm"
            >
              Usar otro email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPending;

