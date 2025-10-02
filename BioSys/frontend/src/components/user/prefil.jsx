import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Settings, Heart, Save, X } from 'lucide-react';

// Interfaces basadas en tu backend
interface UserData {
  _id: string;
  name: string;
  email: string;
  telefono: string;
  direccion: {
    calle: string;
    ciudad: string;
    estado: string;
    pais: string;
  };
  role: string;
  createdAt: string;
}

interface Mascota {
  _id: string;
  nombre: string;
  especie: string;
  raza: string;
  edad: number;
  genero: string;
  estado: string;
}

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    telefono: '',
    direccion: {
      calle: '',
      ciudad: '',
      estado: '',
      pais: ''
    }
  });

  // Función para hacer peticiones autenticadas
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    return fetch(`http://localhost:5000/api${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  // Cargar datos del usuario
  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/auth/me');
      
      if (!response.ok) {
        throw new Error('Error al obtener datos del usuario');
      }
      
      const user = await response.json();
      setUserData(user);
      
      // Inicializar formulario de edición
      setEditForm({
        name: user.name,
        telefono: user.telefono,
        direccion: {
          calle: user.direccion.calle,
          ciudad: user.direccion.ciudad,
          estado: user.direccion.estado,
          pais: user.direccion.pais
        }
      });
    } catch (err) {
      setError('Error al cargar los datos del usuario');
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar mascotas del usuario
  const loadMascotas = async () => {
    try {
      const response = await fetchWithAuth('/mascotas');
      
      if (!response.ok) {
        throw new Error('Error al obtener mascotas');
      }
      
      const mascotasData = await response.json();
      setMascotas(mascotasData);
    } catch (err) {
      console.error('Error loading mascotas:', err);
    }
  };

  useEffect(() => {
    loadUserData();
    loadMascotas();
  }, []);

  // Manejar actualización del perfil
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/usuarios/perfil', {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar perfil');
      }

      const updatedUser = await response.json();
      setUserData(updatedUser.usuario);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancelar edición - restaurar datos originales
      if (userData) {
        setEditForm({
          name: userData.name,
          telefono: userData.telefono,
          direccion: {
            calle: userData.direccion.calle,
            ciudad: userData.direccion.ciudad,
            estado: userData.direccion.estado,
            pais: userData.direccion.pais
          }
        });
      }
    }
    setIsEditing(!isEditing);
    setError('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'No se pudo cargar el perfil'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Header del perfil */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Banner superior */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          </div>
          
          {/* Información principal */}
          <div className="relative px-6 pb-6">
            {/* Botón de editar */}
            <div className="flex justify-end pt-4 gap-2">
              {isEditing && (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200"
                >
                  <X size={16} /> Cancelar
                </button>
              )}
              <button
                onClick={isEditing ? handleSaveProfile : handleEditToggle}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isEditing 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : isEditing ? (
                  <><Save size={16} /> Guardar</>
                ) : (
                  <><Edit3 size={16} /> Editar Perfil</>
                )}
              </button>
            </div>
            
            {/* Información básica */}
            <div className="pt-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{userData.name}</h1>
              <p className="text-lg text-blue-600 font-medium mb-3">{userData.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna izquierda - Información personal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Información de contacto */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User className="text-blue-600" size={20} />
                Información Personal
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <User className="text-gray-400" size={18} />
                        <span className="text-gray-900">{userData.name}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Email (no editable) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="text-gray-400" size={18} />
                      <span className="text-gray-900">{userData.email}</span>
                    </div>
                  </div>
                  
                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.telefono}
                        onChange={(e) => setEditForm({...editForm, telefono: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="text-gray-400" size={18} />
                        <span className="text-gray-900">{userData.telefono}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Dirección</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.direccion.calle}
                        onChange={(e) => setEditForm({
                          ...editForm, 
                          direccion: {...editForm.direccion, calle: e.target.value}
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Calle y número"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="text-gray-400" size={18} />
                        <span className="text-gray-900">{userData.direccion.calle}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Ciudad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Ciudad</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.direccion.ciudad}
                        onChange={(e) => setEditForm({
                          ...editForm, 
                          direccion: {...editForm.direccion, ciudad: e.target.value}
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="text-gray-400" size={18} />
                        <span className="text-gray-900">{userData.direccion.ciudad}, {userData.direccion.estado}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Estado (solo en modo edición) */}
                  {isEditing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Estado/Departamento</label>
                      <input
                        type="text"
                        value={editForm.direccion.estado}
                        onChange={(e) => setEditForm({
                          ...editForm, 
                          direccion: {...editForm.direccion, estado: e.target.value}
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mascotas */}
            {mascotas.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Heart className="text-red-500" size={20} />
                  Mis Mascotas ({mascotas.length})
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mascotas.map((mascota) => (
                    <div key={mascota._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {mascota.nombre.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{mascota.nombre}</h3>
                          <p className="text-sm text-gray-600">{mascota.especie}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Raza:</span> {mascota.raza}</p>
                        <p><span className="font-medium">Edad:</span> {mascota.edad} años</p>
                        <p><span className="font-medium">Género:</span> {mascota.genero}</p>
                        <p><span className="font-medium">Estado:</span> {mascota.estado}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha - Información adicional */}
          <div className="space-y-6">
            
            {/* Estadísticas */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Resumen de Cuenta</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Miembro desde</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(userData.createdAt)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mascotas registradas</span>
                  <span className="font-medium text-gray-900">{mascotas.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tipo de cuenta</span>
                  <span className="font-medium text-blue-600">
                    {userData.role === 'admin' ? 'Administrador' : 'Cliente'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">País</span>
                  <span className="font-medium text-gray-900">{userData.direccion.pais}</span>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="text-gray-600" size={20} />
                Acciones Rápidas
              </h2>
              
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.href = '/nueva-mascota'}
                  className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                >
                  <Heart size={18} />
                  Registrar Mascota
                </button>
                
                <button 
                  onClick={() => window.location.href = '/mascotas'}
                  className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                >
                  <Calendar size={18} />
                  Ver Mis Mascotas
                </button>
                
                <button 
                  onClick={() => window.location.href = '/products'}
                  className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
                >
                  <Settings size={18} />
                  Ver Productos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;