import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Mascota {
  _id: string;
  nombre: string;
  edad: string;
  genero: string;
  raza: string;
  estado: string;
  imagen?: string;
}

const MascotaCard = () => {
  const navigate = useNavigate();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMascotas = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/mascotas", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Error al obtener mascotas");

        const data = await res.json();
        setMascotas(data);
      } catch (err) {
        console.error(err);
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
    return <p className="text-center mt-10">Cargando mascotas...</p>;
  }

  return (
    <div className="p-6">
      {/* Botón para agregar nueva mascota */}
      <div className="flex justify-center mb-6">
        <button
          onClick={irAFormularioNueva}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-200"
        >
          ➕ Agregar Nueva Mascota
        </button>
      </div>

      {/* Lista de mascotas */}
      <div className="flex flex-wrap justify-center gap-6">
        {mascotas.length > 0 ? (
          mascotas.map((m) => (
            <div
              key={m._id}
              onClick={() => irADetalle(m._id)}
              className="flex bg-gray-200 rounded-2xl p-4 w-80 shadow-lg items-center cursor-pointer transition-transform duration-200 hover:scale-105"
            >
              <img
                src={m.imagen || "https://via.placeholder.com/150"}
                alt={m.nombre}
                className="w-28 h-36 object-cover rounded-2xl mr-4"
              />
              <div className="text-sm">
                <p><strong>Nombre:</strong> {m.nombre}</p>
                <p><strong>Edad:</strong> {m.edad}</p>
                <p><strong>Género:</strong> {m.genero}</p>
                <p><strong>Raza:</strong> {m.raza}</p>
                <p><strong>Estado:</strong> {m.estado}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">No tienes mascotas registradas.</p>
        )}
      </div>
    </div>
  );
};

export default MascotaCard;
