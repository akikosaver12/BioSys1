import React, { useEffect, useState } from "react";

const UserPets = ({ user, goBack }) => {
  const [mascotas, setMascotas] = useState([]);

  const getMascotasByUser = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/usuarios/${user._id}/mascotas`);
      const data = await res.json();
      setMascotas(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getMascotasByUser();
  }, [user]);

  return (
    <div>
      <button
        onClick={goBack}
        className="mb-4 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
      >
        ⬅ Volver
      </button>
      <h2 className="text-xl font-bold text-purple-700 mb-6">
        🐶 Mascotas de {user.nombre}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mascotas.length === 0 ? (
          <p>No hay mascotas registradas para este usuario</p>
        ) : (
          mascotas.map((m) => (
            <div key={m._id} className="border rounded-lg p-4 bg-white shadow">
              {m.imagen && (
                <img
                  src={`http://localhost:4000/uploads/${m.imagen}`}
                  alt={m.nombre}
                  className="w-full h-40 object-cover rounded mb-4"
                />
              )}
              <h3 className="font-bold text-purple-700">{m.nombre}</h3>
              <p className="text-gray-600">Especie: {m.especie}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserPets;
