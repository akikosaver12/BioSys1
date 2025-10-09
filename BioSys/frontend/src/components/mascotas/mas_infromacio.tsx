import React, { useState, useEffect } from "react";  
import { useNavigate, useParams } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "https://biosys1.onrender.com/api";

interface Vacuna {
  nombre: string;
  fecha: string;
  imagen?: {
    data: string;
    contentType: string;
  };
}

interface Operacion {
  nombre: string;
  descripcion: string;
  fecha: string;
  imagen?: {
    data: string;
    contentType: string;
  };
}

interface Mascota {
  _id: string;
  nombre?: string;
  especie?: string;
  estado?: string;
  raza?: string;
  edad?: number;
  genero?: string;
  vacunas?: Vacuna[];
  operaciones?: Operacion[];
  imagenUrl?: string; // 🆕 Imagen en Base64
  usuario?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const MascotaInfo: React.FC = () => {
  const { idMascota } = useParams<{ idMascota: string }>();
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMascota = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No hay token de autenticación");
          setLoading(false);
          return;
        }

        if (!idMascota) {
          setError("No se proporcionó un ID de mascota");
          setLoading(false);
          return;
        }

        const url = `${API_URL}/mascotas/${idMascota}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al obtener los datos de la mascota");
        }

        const data = await response.json();
        setMascota(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Ocurrió un error desconocido");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMascota();
  }, [idMascota]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Cargando información de la mascota...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-700 flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-500 font-semibold text-xl mb-4">❌ Error: {error}</p>
          <p className="text-gray-500 mt-2">
            {idMascota ? `ID de mascota: ${idMascota}` : "Sin ID específico"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-lime-400 hover:bg-lime-500 text-black px-6 py-3 rounded-xl font-bold transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!mascota) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-700 flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-2xl p-8">
          <p className="text-gray-500 text-lg">No se encontró información de la mascota</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Columna Izquierda */}
      <div className="w-2/3 p-10 space-y-6">
        <div className="bg-white shadow-xl rounded-3xl p-8">
          <h1 className="text-3xl font-bold text-lime-500 mb-2">
            {mascota.nombre || "Sin nombre"}
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            Información detallada de tu mascota
          </p>

          <div className="mt-6 space-y-4">
            <InfoField label="Estado" value={mascota.estado} />
            <InfoField label="Raza" value={mascota.raza} />
            <InfoField
              label="Edad"
              value={mascota.edad ? `${mascota.edad} años` : undefined}
            />
            <InfoField label="Género" value={mascota.genero} />
          </div>

          {/* Vacunas */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">💉 Vacunas</h2>
            {mascota.vacunas && mascota.vacunas.length > 0 ? (
              <ul className="space-y-2">
                {mascota.vacunas.map((v, i) => (
                  <li key={i} className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-800">{v.nombre}</span>
                      <span className="text-green-600 text-sm">
                        {new Date(v.fecha).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No hay vacunas registradas</p>
            )}
          </div>

          {/* Operaciones */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">⚕️ Operaciones</h2>
            {mascota.operaciones && mascota.operaciones.length > 0 ? (
              <ul className="space-y-3">
                {mascota.operaciones.map((op, i) => (
                  <li key={i} className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                      <strong className="text-blue-800">{op.nombre}</strong>
                      <span className="text-blue-600 text-sm">
                        {new Date(op.fecha).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-blue-700 text-sm">{op.descripcion}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No hay operaciones registradas</p>
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha */}
      <div className="relative w-1/3 flex flex-col items-center justify-start p-8">
        <MascotaCard mascota={mascota} />

        <div className="mt-8 w-full flex items-center justify-center">
          {mascota.imagenUrl ? (
            // 🆕 IMAGEN BASE64 DESDE MONGODB
            <img
              src={mascota.imagenUrl}
              alt={mascota.nombre || "Mascota"}
              className="max-h-[500px] max-w-full rounded-3xl shadow-2xl object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/300x400/cccccc/666666?text=Sin+Imagen";
              }}
            />
          ) : (
            <div className="w-80 h-96 bg-gray-100 rounded-3xl flex items-center justify-center shadow-xl">
              <div className="text-center">
                <span className="text-6xl mb-4 block">🐾</span>
                <p className="text-gray-500">Sin imagen disponible</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="bg-gray-50 p-4 rounded-xl">
    <h3 className="text-sm font-medium text-gray-500 mb-1">{label}</h3>
    <p className="text-base text-gray-900 font-semibold">{value || "No especificado"}</p>
  </div>
);

const MascotaCard: React.FC<{ mascota: Mascota }> = ({ mascota }) => {
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta mascota?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No hay token de autenticación");
        return;
      }

      const response = await fetch(`${API_URL}/mascotas/${mascota._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar mascota");
      }

      alert("✅ Mascota eliminada con éxito");
      navigate("/mascotas");
    } catch (err) {
      console.error("Error eliminando mascota:", err);
      alert("❌ Ocurrió un error al eliminar la mascota");
    }
  };

  return (
    <div className="absolute top-4 right-4 flex gap-3">
      <button
        className="px-4 py-2 text-sm font-semibold border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
        onClick={() => navigate("/mascotas")}
      >
        ← Volver
      </button>
      <button
        className="px-4 py-2 text-sm font-semibold bg-yellow-400 text-black rounded-xl hover:bg-yellow-500 transition-colors"
        onClick={() => navigate(`/edit/${mascota._id}`)}
      >
        ✏️ Editar
      </button>
      <button
        className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
        onClick={handleDelete}
      >
        🗑️ Eliminar
      </button>
    </div>
  );
};

export default MascotaInfo;