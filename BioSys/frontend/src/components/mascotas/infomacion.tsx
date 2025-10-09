import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// CONSTANTES - Consistente con otros archivos
const API_URL = process.env.REACT_APP_API_URL || "https://biosys1.onrender.com/api";

interface Mascota {
  _id: string;
  nombre: string;
  edad: string;
  genero: string;
  raza: string;
  estado: string;
  imagenUrl?: string; // 🆕 Ahora es imagenUrl (Base64)
}

const MascotaCard = () => {
  const navigate = useNavigate();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMascotas = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("No hay sesión activa");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/mascotas`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        setMascotas(data);
        setError(null);
      } catch (err) {
        console.error("Error al obtener mascotas:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchMascotas();
  }, []);

  const irADetalle = (id: string) => {
    navigate(`/mascota/${id}`);
  };

  const irAFormularioNueva = () => {
    navigate("/nueva-mascota");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando tus mascotas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto">
          <p className="text-red-600 font-semibold mb-2">❌ Error al cargar mascotas</p>
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Botón para agregar nueva mascota */}
      <div className="flex justify-center mb-8">
        <button
          onClick={irAFormularioNueva}
          className="bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-black px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
        >
          <span className="text-2xl">➕</span>
          Agregar Nueva Mascota
        </button>
      </div>

      {/* Lista de mascotas */}
      <div className="flex flex-wrap justify-center gap-6">
        {mascotas.length > 0 ? (
          mascotas.map((m) => (
            <div
              key={m._id}
              onClick={() => irADetalle(m._id)}
              className="flex bg-white rounded-3xl p-6 w-96 shadow-lg hover:shadow-2xl items-center cursor-pointer transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              {/* 🆕 IMAGEN BASE64 DESDE MONGODB */}
              <img
                src={m.imagenUrl || "https://via.placeholder.com/150?text=Sin+Imagen"}
                alt={m.nombre}
                className="w-32 h-40 object-cover rounded-2xl mr-6 shadow-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://via.placeholder.com/150?text=Error";
                }}
              />
              
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{m.nombre}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">🎂 Edad:</span>
                    {m.edad} {parseInt(m.edad) === 1 ? 'año' : 'años'}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">
                      {m.genero === 'Macho' ? '♂️' : '♀️'} Género:
                    </span>
                    {m.genero}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">🐾 Raza:</span>
                    {m.raza}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">📊 Estado:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      m.estado === 'Disponible' ? 'bg-green-100 text-green-800' :
                      m.estado === 'En proceso' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {m.estado}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="ml-4 text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-6xl">🐾</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No tienes mascotas registradas
            </h3>
            <p className="text-gray-600 mb-6">
              ¡Registra tu primera mascota para comenzar a gestionar su información!
            </p>
            <button
              onClick={irAFormularioNueva}
              className="bg-lime-400 hover:bg-lime-500 text-black px-6 py-3 rounded-xl font-bold transition-colors shadow-lg"
            >
              Registrar Primera Mascota
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MascotaCard;