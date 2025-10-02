// 📧 EmailVerificationSuccess.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const EmailVerificationSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [estado, setEstado] = useState('verificando'); // 'verificando', 'exito', 'error'
  const [mensaje, setMensaje] = useState('');
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const verificarEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setEstado('error');
        setMensaje('Token de verificación no encontrado');
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/verify-email/${token}`);
        const data = await res.json();

        if (res.ok) {
          setEstado('exito');
          setUsuario(data.usuario);
          setMensaje(data.message);
        } else {
          setEstado('error');
          setMensaje(data.error || 'Error al verificar email');
        }
      } catch (error) {
        setEstado('error');
        setMensaje('Error de conexión al verificar email');
      }
    };

    verificarEmail();
  }, [searchParams]);

  if (estado === 'verificando') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Verificando tu email...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          {estado === 'exito' ? (
            <>
              {/* Éxito */}
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-700 mb-2">
                  ¡Email verificado!
                </h2>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">{mensaje}</p>
                {usuario && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-800">
                      <strong>Bienvenido, {usuario.name}!</strong>
                    </p>
                    <p className="text-green-700 text-sm">
                      Tu cuenta ha sido activada exitosamente
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Iniciar sesión ahora
              </button>
            </>
          ) : (
            <>
              {/* Error */}
              <div className="mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-red-700 mb-2">
                  Error de verificación
                </h2>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">{mensaje}</p>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-800 text-sm">
                    El enlace puede haber expirado o ser inválido
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/registro')}
                  className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold"
                >
                  Registrarse nuevamente
                </button>
                
                <button
                  onClick={() => navigate('/login')}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition"
                >
                  Ir a iniciar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationSuccess;