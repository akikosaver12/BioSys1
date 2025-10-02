import React, { useState, useEffect } from "react";  
import { useNavigate, useParams } from "react-router-dom";

interface Vacuna {
  nombre: string;
  fecha: string;
  imagen?: string;
}

interface Operacion {
  nombre: string;
  descripcion: string;
  fecha: string;
  imagen?: string;
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
  imagen?: string;
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

        const url = `http://localhost:5000/api/mascotas/${idMascota}`;
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
        <p className="text-lg font-medium">Cargando información de la mascota...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-700 flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
          <p className="text-red-500 font-semibold">Error: {error}</p>
          <p className="text-gray-500 mt-2">
            {idMascota ? `ID de mascota: ${idMascota}` : "Sin ID específico"}
          </p>
        </div>
      </div>
    );
  }

  if (!mascota) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-700 flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <p className="text-gray-500">No se encontró información de la mascota</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Columna Izquierda */}
      <div className="w-2/3 p-10 space-y-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h1 className="text-2xl font-bold text-green-600">
            {mascota.nombre || "Sin nombre"}
          </h1>
          <p className="text-sm text-gray-400">
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
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-700">Vacunas</h2>
            {mascota.vacunas && mascota.vacunas.length > 0 ? (
              <ul className="list-disc ml-6 text-gray-600">
                {mascota.vacunas.map((v, i) => (
                  <li key={i}>
                    {v.nombre} - {new Date(v.fecha).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No hay vacunas registradas</p>
            )}
          </div>

          {/* Operaciones */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-700">Operaciones</h2>
            {mascota.operaciones && mascota.operaciones.length > 0 ? (
              <ul className="list-disc ml-6 text-gray-600">
                {mascota.operaciones.map((op, i) => (
                  <li key={i}>
                    <strong>{op.nombre}</strong> - {op.descripcion} (
                    {new Date(op.fecha).toLocaleDateString()})
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

        <div className="mt-6 w-full flex items-center justify-center">
          {mascota.imagen ? (
            <img
              src={mascota.imagen}
              alt={mascota.nombre || "Mascota"}
              className="max-h-[400px] rounded-xl shadow-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/300x400/cccccc/666666?text=Sin+Imagen";
              }}
            />
          ) : (
            <div className="w-64 h-80 bg-gray-200 rounded-lg flex items-center justify-center shadow-inner">
              <p className="text-gray-500 text-center">Sin imagen disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div>
    <h3 className="text-sm font-medium text-gray-500">{label}</h3>
    <p className="text-base text-gray-700">{value || "No especificado"}</p>
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

      const response = await fetch(`http://localhost:5000/api/mascotas/${mascota._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar mascota");
      }

      alert("Mascota eliminada con éxito");
      navigate("/mascotas");
    } catch (err) {
      console.error("Error eliminando mascota:", err);
      alert("Ocurrió un error al eliminar la mascota");
    }
  };

  return (
    <div className="absolute top-4 right-4 flex gap-3">
      <button
        className="px-4 py-2 text-sm font-semibold border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition"
        onClick={() => navigate("/mascotas")}
      >
        Volver
      </button>
      <button
        className="px-4 py-2 text-sm font-semibold bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition"
        onClick={() => navigate(`/edit/${mascota._id}`)}
      >
        Editar
      </button>
      <button
        className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        onClick={handleDelete}
      >
        Eliminar
      </button>
    </div>
  );
};

export default MascotaInfo;
