import React, { useState, useEffect } from 'react';

type Mascota = {
  _id: string;
  nombre: string;
  especie: string;
  raza: string;
  edad: number;
};

type HorarioDisponible = {
  hora: string;
  periodo: string;
};

type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';

type Cita = {
  _id: string;
  tipo: string;
  fecha: string;
  hora: string;
  motivo: string;
  notas?: string;
  estado: EstadoCita;
  mascota: Mascota | string;
};

const BASE_URL = 'http://localhost:5000/api'; // Ajusta al puerto de tu backend

const CitasPage = () => {
  const [formData, setFormData] = useState({
    mascotaId: '',
    tipo: '',
    fecha: '',
    hora: '',
    motivo: '',
    notas: ''
  });

  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState<HorarioDisponible[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMascotas, setLoadingMascotas] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const parseJsonResponse = async (response: Response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Respuesta no es JSON válido:', text);
      throw new Error('El servidor devolvió una respuesta inválida');
    }
  };

  useEffect(() => {
    obtenerMascotas();
    obtenerCitas();
  }, []);

  useEffect(() => {
    if (formData.fecha) {
      obtenerHorariosDisponibles();
    }
  }, [formData.fecha]);

  const obtenerMascotas = async () => {
    try {
      setLoadingMascotas(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setMensaje({ tipo: 'error', texto: 'No hay sesión activa. Por favor inicia sesión.' });
        return;
      }

      const response = await fetch(`${BASE_URL}/mascotas`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await parseJsonResponse(response);
        setMascotas(data);
        if (data.length === 0) {
          setMensaje({ tipo: 'error', texto: 'No tienes mascotas registradas. Registra una mascota primero para poder agendar citas.' });
        }
      } else if (response.status === 401) {
        setMensaje({ tipo: 'error', texto: 'Sesión expirada. Por favor inicia sesión nuevamente.' });
        localStorage.removeItem('token');
      } else {
        const error = await parseJsonResponse(response);
        setMensaje({ tipo: 'error', texto: error.error || `Error ${response.status}: ${response.statusText}` });
      }
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error de conexión al cargar las mascotas. Verifica que el servidor esté ejecutándose.' });
    } finally {
      setLoadingMascotas(false);
    }
  };

  const obtenerCitas = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${BASE_URL}/citas`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await parseJsonResponse(response);
        setCitas(data);
      }
    } catch (error) {
      console.error('Error obteniendo citas:', error);
    }
  };

  const obtenerHorariosDisponibles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/citas/horarios-disponibles/${formData.fecha}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await parseJsonResponse(response);
        setHorariosDisponibles(data.horariosDisponibles || []);
      } else {
        setHorariosDisponibles([]);
        const error = await parseJsonResponse(response);
        if (error.error) {
          setMensaje({ tipo: 'error', texto: error.error });
          setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
        }
      }
    } catch (error) {
      setHorariosDisponibles([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'fecha') {
      setFormData(prev => ({ ...prev, hora: '' }));
    }
    if (mensaje.tipo === 'error' && mensaje.texto.includes('mascotas registradas')) {
      setMensaje({ tipo: '', texto: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mascotas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'No tienes mascotas registradas. Registra una mascota primero.' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/citas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await parseJsonResponse(response);
        setMensaje({ tipo: 'success', texto: '¡Cita agendada exitosamente!' });
        setFormData({ mascotaId: '', tipo: '', fecha: '', hora: '', motivo: '', notas: '' });
        obtenerCitas();
        setHorariosDisponibles([]);
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
      } else {
        const error = await parseJsonResponse(response);
        setMensaje({ tipo: 'error', texto: error.error || 'Error al agendar cita' });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
      }
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error de conexión' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
    }
    setLoading(false);
  };

  const formatearFecha = (fecha: string | number | Date) => {
    const parsed = new Date(fecha);
    if (isNaN(parsed.getTime())) return String(fecha);
    return parsed.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatearHora = (hora: string) => {
    if (!hora.includes(':')) return hora;
    const [hours, minutes] = hora.split(':');
    const hour24 = parseInt(hours, 10);
    if (isNaN(hour24)) return hora;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const obtenerFechaMinima = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  const getEstadoBadge = (estado: EstadoCita) => {
    const estilos: Record<EstadoCita, string> = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      confirmada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800',
      completada: 'bg-blue-100 text-blue-800'
    };
    const iconos: Record<EstadoCita, string> = {
      pendiente: '⏳',
      confirmada: '✅',
      cancelada: '❌',
      completada: '🏁'
    };
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${estilos[estado]}`}>
        <span>{iconos[estado]}</span>
        <span className="capitalize">{estado}</span>
      </span>
    );
  };

  const cancelarCita = async (citaId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta cita?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/citas/${citaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: 'Cita cancelada exitosamente' });
        obtenerCitas();
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      } else {
        const errorObj = await parseJsonResponse(response) || {};
        setMensaje({ tipo: 'error', texto: errorObj.error || 'Error al cancelar cita' });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      }
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error de conexión' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    }
  };

  if (loadingMascotas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Cargando sistema de citas...</h2>
          <p className="text-gray-500 mt-2">Verificando conexión con el servidor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-100 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 rounded-full px-4 py-2 mb-6">
              <span className="text-lg">🏥</span>
              <span className="font-medium">Sistema de Citas</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Agenda una <span className="text-blue-600">Cita</span> para tu Mascota
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Horarios de atención: 7:00 AM - 12:00 PM y 2:00 PM - 6:00 PM
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* FORMULARIO DE CITA */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                📅 Agendar Nueva Cita
              </h2>
              <p className="text-gray-600">
                Completa el formulario para agendar una cita para tu mascota
              </p>
            </div>
            
            {/* MENSAJE */}
            {mensaje.texto && (
              <div className={`p-4 rounded-2xl mb-6 flex items-center space-x-3 ${
                mensaje.tipo === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  mensaje.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <span className="text-white text-sm">
                    {mensaje.tipo === 'success' ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{mensaje.texto}</p>
                  {mensaje.texto.includes('mascotas registradas') && (
                    <p className="text-sm mt-1">
                      <a href="/mascotas" className="underline hover:no-underline">
                        Haz clic aquí para registrar tu primera mascota
                      </a>
                    </p>
                  )}
                  {mensaje.texto.includes('servidor') && (
                    <div className="text-sm mt-2 bg-yellow-50 p-2 rounded border">
                      <p><strong>Pasos para solucionar:</strong></p>
                      <ol className="list-decimal ml-4 mt-1">
                        <li>Verifica que el servidor backend esté ejecutándose</li>
                        <li>Confirma que está en el puerto correcto (puerto 5000)</li>
                        <li>Revisa la consola del servidor para errores</li>
                        <li>Verifica la conexión a MongoDB</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* FORMULARIO */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* SELECCIONAR MASCOTA */}
              <div>
                <label htmlFor="mascotaId" className="block text-gray-700 font-semibold mb-3">
                  Mascota * ({mascotas.length} {mascotas.length === 1 ? 'mascota disponible' : 'mascotas disponibles'})
                </label>
                <select
                  id="mascotaId"
                  name="mascotaId"
                  value={formData.mascotaId}
                  onChange={handleChange}
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-700"
                  required
                  disabled={mascotas.length === 0}
                >
                  <option value="">
                    {mascotas.length === 0 
                      ? 'No tienes mascotas registradas' 
                      : 'Selecciona una mascota'
                    }
                  </option>
                  {mascotas.map(mascota => (
                    <option key={mascota._id} value={mascota._id}>
                      {mascota.nombre} - {mascota.especie} ({mascota.raza}) - {mascota.edad} {mascota.edad === 1 ? 'año' : 'años'}
                    </option>
                  ))}
                </select>
                {mascotas.length === 0 && (
                  <p className="text-sm text-red-500 mt-2">
                    <a href="/mascotas" className="underline hover:no-underline">
                      Registra tu primera mascota aquí
                    </a>
                  </p>
                )}
              </div>

              {/* TIPO DE CITA */}
              <div>
                <label htmlFor="tipo" className="block text-gray-700 font-semibold mb-3">
                  Tipo de Cita *
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-700"
                  required
                  disabled={mascotas.length === 0}
                >
                  <option value="">Selecciona el tipo de cita</option>
                  <option value="consulta">🩺 Consulta General</option>
                  <option value="operacion">⚕️ Operación/Cirugía</option>
                  <option value="vacunacion">💉 Vacunación</option>
                  <option value="emergencia">🚨 Emergencia</option>
                </select>
              </div>

              {/* FECHA */}
              <div>
                <label htmlFor="fecha" className="block text-gray-700 font-semibold mb-3">
                  Fecha *
                </label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  min={obtenerFechaMinima()}
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-700"
                  required
                  disabled={mascotas.length === 0}
                />
                <p className="text-sm text-gray-500 mt-2">
                  * No se pueden agendar citas los domingos
                </p>
              </div>

              {/* HORA */}
              <div>
                <label htmlFor="hora" className="block text-gray-700 font-semibold mb-3">
                  Hora * {formData.fecha && `(${horariosDisponibles.length} horarios disponibles)`}
                </label>
                <select
                  id="hora"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-700"
                  required
                  disabled={!formData.fecha || mascotas.length === 0}
                >
                  <option value="">
                    {!formData.fecha ? 'Selecciona primero una fecha' : 'Selecciona una hora'}
                  </option>
                  {horariosDisponibles.map(horario => (
                    <option key={horario.hora} value={horario.hora}>
                      {formatearHora(horario.hora)} - {horario.periodo}
                    </option>
                  ))}
                </select>
                {formData.fecha && horariosDisponibles.length === 0 && (
                  <p className="text-sm text-red-500 mt-2">
                    No hay horarios disponibles para esta fecha
                  </p>
                )}
              </div>

              {/* MOTIVO */}
              <div>
                <label htmlFor="motivo" className="block text-gray-700 font-semibold mb-3">
                  Motivo de la Cita *
                </label>
                <textarea
                  id="motivo"
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-700 resize-none"
                  placeholder="Describe el motivo de la consulta..."
                  required
                  disabled={mascotas.length === 0}
                />
              </div>

              {/* NOTAS ADICIONALES */}
              <div>
                <label htmlFor="notas" className="block text-gray-700 font-semibold mb-3">
                  Notas Adicionales
                </label>
                <textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-700 resize-none"
                  placeholder="Información adicional (opcional)..."
                  disabled={mascotas.length === 0}
                />
              </div>

              {/* BOTÓN ENVIAR */}
              <button 
                type="submit" 
                disabled={loading || mascotas.length === 0}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Agendando...</span>
                  </>
                ) : mascotas.length === 0 ? (
                  <>
                    <span>🚫</span>
                    <span>Registra una mascota primero</span>
                  </>
                ) : (
                  <>
                    <span>📅</span>
                    <span>Agendar Cita</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* MIS CITAS */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <span className="text-3xl">📋</span>
                <span>Mis Citas Agendadas</span>
              </h3>
              
              {citas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-gray-500 text-lg">No tienes citas agendadas</p>
                  <p className="text-gray-400">Agenda tu primera cita usando el formulario</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {citas.slice(0, 5).map(cita => (
                    <div key={cita._id} className="border border-gray-200 rounded-2xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <span className="text-xl">
                              {cita.tipo === 'consulta' && '🩺'}
                              {cita.tipo === 'operacion' && '⚕️'}
                              {cita.tipo === 'vacunacion' && '💉'}
                              {cita.tipo === 'emergencia' && '🚨'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">
                              {typeof cita.mascota === 'object' && cita.mascota !== null
                                ? cita.mascota.nombre
                                : typeof cita.mascota === 'string'
                                  ? cita.mascota
                                  : 'Mascota'}
                            </h4>
                            <p className="text-gray-600 text-sm capitalize">
                              {cita.tipo.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getEstadoBadge(cita.estado)}
                          {cita.estado === 'pendiente' && (
                            <button
                              onClick={() => cancelarCita(cita._id)}
                              className="text-red-500 hover:text-red-700 text-sm underline"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">📅 Fecha:</span>
                          <p className="font-medium">{formatearFecha(cita.fecha)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">🕐 Hora:</span>
                          <p className="font-medium">{formatearHora(cita.hora)}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <span className="text-gray-500">📝 Motivo:</span>
                        <p className="text-gray-700 mt-1">{cita.motivo}</p>
                      </div>
                      
                      {cita.notas && (
                        <div className="mt-3">
                          <span className="text-gray-500">📋 Notas:</span>
                          <p className="text-gray-600 text-sm mt-1">{cita.notas}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {citas.length > 5 && (
                    <div className="text-center pt-4">
                      <p className="text-gray-500">Y {citas.length - 5} citas más...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            

            {/* INFORMACIÓN DE HORARIOS */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <span>🕒</span>
                <span>Horarios de Atención</span>
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-lg">🌅</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Mañana</p>
                      <p className="text-gray-600">7:00 AM - 12:00 PM</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-lg">🌇</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Tarde</p>
                      <p className="text-gray-600">2:00 PM - 6:00 PM</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-100 p-4 rounded-xl border border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-lg">🚫</span>
                    </div>
                    <div>
                      <p className="font-semibold text-red-700">Domingos</p>
                      <p className="text-red-600">Cerrado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TIPOS DE CITA */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <span>🏥</span>
                <span>Tipos de Servicios</span>
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  { 
                    tipo: 'consulta',
                    nombre: 'Consulta General',
                    icono: '🩺',
                    descripcion: 'Revisión general y diagnóstico',
                    color: 'bg-blue-500'
                  },
                  {
                    tipo: 'operacion',
                    nombre: 'Operación/Cirugía',
                    icono: '⚕️',
                    descripcion: 'Procedimientos quirúrgicos',
                    color: 'bg-red-500'
                  },
                  {
                    tipo: 'vacunacion',
                    nombre: 'Vacunación',
                    icono: '💉',
                    descripcion: 'Aplicación de vacunas',
                    color: 'bg-green-500'
                  },
                  {
                    tipo: 'emergencia',
                    nombre: 'Emergencia',
                    icono: '🚨',
                    descripcion: 'Atención urgente',
                    color: 'bg-yellow-500'
                  }
                ].map(servicio => (
                  <div key={servicio.tipo} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                    <div className={`w-12 h-12 ${servicio.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-xl">{servicio.icono}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{servicio.nombre}</h4>
                      <p className="text-gray-600 text-sm">{servicio.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CONTACTO DE EMERGENCIA */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl p-8 border border-red-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <span>🚨</span>
                <span>Emergencias 24/7</span>
              </h3>
              
              <p className="text-gray-600 mb-6">
                Si tu mascota tiene una emergencia fuera del horario de atención, contáctanos inmediatamente.
              </p>
              
              <div className="space-y-3">
                <a 
                  href="tel:+573001234567"
                  className="flex items-center space-x-3 bg-white p-4 rounded-xl hover:shadow-md transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">📞</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">Llamar Emergencia</p>
                    <p className="text-sm text-gray-500">+57 300 123 4567</p>
                  </div>
                </a>
                
                <a 
                  href="https://wa.me/573001234567"
                  className="flex items-center space-x-3 bg-white p-4 rounded-xl hover:shadow-md transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">💬</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">WhatsApp</p>
                    <p className="text-sm text-gray-500">Respuesta inmediata</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitasPage;

function setLoading(arg0: boolean) {
  throw new Error('Function not implemented.');
}
function parseJsonResponse(response: Response) {
  throw new Error('Function not implemented.');
}

function setMensaje(arg0: { tipo: string; texto: string; }) {
  throw new Error('Function not implemented.');
}

function obtenerCitas() {
  throw new Error('Function not implemented.');
}

function setHorariosDisponibles(arg0: never[]) {
  throw new Error('Function not implemented.');
}

