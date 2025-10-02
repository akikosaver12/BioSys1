import React, { useState, useEffect, useRef } from "react";
import { 
  Package, Users, Calendar, Plus, Edit3, Trash2, Eye, 
  RefreshCw, ArrowLeft, Save, X, Camera, Shield, 
  Truck, Tag, Award, AlertCircle, CheckCircle,
  TrendingUp, Activity, Settings
} from "lucide-react";

const BASE_URL = "http://localhost:5000";

const AdminPanel = () => {
  // --- Obtener token robusto ---
  const getToken = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw =
        localStorage.getItem("token") || localStorage.getItem("auth") || "";
      try {
        const maybe = JSON.parse(raw);
        if (maybe && typeof maybe === "object" && maybe.token) return maybe.token;
      } catch {}
      return raw;
    }
    return "";
  };

  const [activeTab, setActiveTab] = useState("productos");
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    descripcion: "",
    imagen: null,
    categoria: "otros",
    stock: "",
    tieneDescuento: false,
    porcentajeDescuento: "",
    fechaInicioDescuento: "",
    fechaFinDescuento: "",
    tieneGarantia: false,
    mesesGarantia: "",
    descripcionGarantia: "",
    envioGratis: false
  });
  
  // ESTADO PARA EDICIÓN
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [previewImage, setPreviewImage] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mascotasUsuario, setMascotasUsuario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [warn, setWarn] = useState("");
  const [serverStatus, setServerStatus] = useState("checking");
  const fileRef = useRef(null);

  // FUNCIÓN PARA INICIAR EDICIÓN
  const startEditProduct = (producto) => {
    setIsEditMode(true);
    setEditingProduct(producto);
    setActiveTab("productos");
    
    // Llenar el formulario con los datos del producto
    setFormData({
      nombre: producto.nombre || "",
      precio: producto.precio || "",
      descripcion: producto.descripcion || "",
      imagen: null, // La imagen se mantendrá como estaba
      categoria: producto.categoria || "otros",
      stock: producto.stock || "",
      tieneDescuento: producto.descuento?.tiene || false,
      porcentajeDescuento: producto.descuento?.porcentaje || "",
      fechaInicioDescuento: producto.descuento?.fechaInicio ? 
        new Date(producto.descuento.fechaInicio).toISOString().split('T')[0] : "",
      fechaFinDescuento: producto.descuento?.fechaFin ? 
        new Date(producto.descuento.fechaFin).toISOString().split('T')[0] : "",
      tieneGarantia: producto.garantia?.tiene || false,
      mesesGarantia: producto.garantia?.meses || "",
      descripcionGarantia: producto.garantia?.descripcion || "",
      envioGratis: producto.envioGratis || false
    });
    
    setPreviewImage(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // FUNCIÓN PARA CANCELAR EDICIÓN
  const cancelEdit = () => {
    setIsEditMode(false);
    setEditingProduct(null);
    
    // Resetear formulario
    setFormData({
      nombre: "",
      precio: "",
      descripcion: "",
      imagen: null,
      categoria: "otros",
      stock: "",
      tieneDescuento: false,
      porcentajeDescuento: "",
      fechaInicioDescuento: "",
      fechaFinDescuento: "",
      tieneGarantia: false,
      mesesGarantia: "",
      descripcionGarantia: "",
      envioGratis: false
    });
    
    setPreviewImage(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Función para agregar vacunas
  const handleAgregarVacuna = async (e, mascotaId) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const vacuna = {
      nombre: formData.get("nombre"),
      fecha: formData.get("fecha"),
    };

    const token = getToken();
    try {
      const res = await fetch(`${BASE_URL}/api/mascotas/${mascotaId}/vacunas`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(vacuna),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error al agregar vacuna: ${errorText}`);
      }
      const result = await res.json();
      setMascotasUsuario((prev) =>
        prev.map((m) => (m._id === mascotaId ? result.mascota : m))
      );
      e.target.reset();
      alert("✅ Vacuna agregada correctamente");
    } catch (err) {
      alert("No se pudo agregar la vacuna: " + err.message);
    }
  };

  // Función para agregar operaciones
  const handleAgregarOperacion = async (e, mascotaId) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const operacion = {
      nombre: formData.get("nombre"),
      descripcion: formData.get("descripcion"),
      fecha: formData.get("fecha"),
    };

    const token = getToken();
    try {
      const res = await fetch(`${BASE_URL}/api/mascotas/${mascotaId}/operaciones`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(operacion),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error al agregar operación: ${errorText}`);
      }
      const result = await res.json();
      setMascotasUsuario((prev) =>
        prev.map((m) => (m._id === mascotaId ? result.mascota : m))
      );
      e.target.reset();
      alert("✅ Operación agregada correctamente");
    } catch (err) {
      alert("No se pudo agregar la operación: " + err.message);
    }
  };

  // --- Server Health ---
  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        setServerStatus("online");
        return true;
      } else {
        setServerStatus("offline");
        return false;
      }
    } catch (error) {
      console.error("Server health check failed:", error);
      setServerStatus("offline");
      return false;
    }
  };

  // --- fetch helper ---
  const fetchJSON = async (url, options = {}) => {
    try {
      const token = getToken();
      const headers = { ...(options.headers || {}) };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { ...options, headers });
      let bodyText = await res.text();
      if (!res.ok) {
        let message = bodyText || `HTTP ${res.status}`;
        try {
          const j = JSON.parse(bodyText);
          message = j.error || j.message || message;
        } catch {}
        throw new Error(`${res.status} ${res.statusText} - ${message}`);
      }
      try {
        return JSON.parse(bodyText);
      } catch {
        return bodyText;
      }
    } catch (error) {
      console.error(`❌ Fetch error for ${url}:`, error);
      throw error;
    }
  };

  // --- Handlers formulario actualizados ---
  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (files && files[0]) {
      setFormData((s) => ({ ...s, [name]: files[0] }));
      setPreviewImage(URL.createObjectURL(files[0]));
    } else if (type === 'checkbox') {
      setFormData((s) => ({ ...s, [name]: checked }));
    } else {
      setFormData((s) => ({ ...s, [name]: value }));
    }
  };

  // FUNCIÓN ACTUALIZADA PARA MANEJAR CREAR/EDITAR
  const handleSubmit = async (e) => {
    e.preventDefault();
    setWarn("");
    const isServerOnline = await checkServerHealth();
    if (!isServerOnline) {
      setWarn("❌ El servidor no está disponible.");
      return;
    }
    const token = getToken();
    if (!token) return setWarn("Debes iniciar sesión para gestionar productos.");

    setLoading(true);
    try {
      const data = new FormData();
      
      // Campos básicos
      data.append("nombre", formData.nombre);
      data.append("precio", formData.precio);
      data.append("descripcion", formData.descripcion);
      
      // Nuevos campos
      data.append("categoria", formData.categoria);
      data.append("stock", formData.stock || "0");
      data.append("envioGratis", formData.envioGratis);
      
      // Campos de descuento
      data.append("tieneDescuento", formData.tieneDescuento);
      if (formData.tieneDescuento) {
        data.append("porcentajeDescuento", formData.porcentajeDescuento);
        if (formData.fechaInicioDescuento) {
          data.append("fechaInicioDescuento", formData.fechaInicioDescuento);
        }
        if (formData.fechaFinDescuento) {
          data.append("fechaFinDescuento", formData.fechaFinDescuento);
        }
      }
      
      // Campos de garantía
      data.append("tieneGarantia", formData.tieneGarantia);
      if (formData.tieneGarantia) {
        data.append("mesesGarantia", formData.mesesGarantia);
        data.append("descripcionGarantia", formData.descripcionGarantia);
      }

      if (formData.imagen) {
        data.append("imagen", formData.imagen);
      }

      // DETERMINAR SI ES CREAR O EDITAR
      const url = isEditMode 
        ? `${BASE_URL}/api/productos/${editingProduct._id}`
        : `${BASE_URL}/api/productos`;
      
      const method = isEditMode ? "PUT" : "POST";

      await fetchJSON(url, {
        method: method,
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      alert(isEditMode ? "✅ Producto actualizado con éxito" : "✅ Producto agregado con éxito");
      
      // Reset form
      setFormData({
        nombre: "",
        precio: "",
        descripcion: "",
        imagen: null,
        categoria: "otros",
        stock: "",
        tieneDescuento: false,
        porcentajeDescuento: "",
        fechaInicioDescuento: "",
        fechaFinDescuento: "",
        tieneGarantia: false,
        mesesGarantia: "",
        descripcionGarantia: "",
        envioGratis: false
      });
      
      setPreviewImage(null);
      setIsEditMode(false);
      setEditingProduct(null);
      
      if (fileRef.current) fileRef.current.value = "";
      getProductos();
    } catch (err) {
      setWarn(`❌ Error al ${isEditMode ? 'actualizar' : 'crear'} producto: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Usuarios ---
  const getUsuarios = async () => {
    setWarn("");
    const isServerOnline = await checkServerHealth();
    if (!isServerOnline) return setUsuarios([]);
    try {
      const token = getToken();
      if (!token) return setWarn("Debes iniciar sesión como admin.");
      const me = await fetchJSON(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (me?.role !== "admin") return setWarn("Tu usuario no es admin.");
      const data = await fetchJSON(`${BASE_URL}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(data);
    } catch (error) {
      setWarn(`No se pudieron cargar los usuarios: ${error.message}`);
    }
  };

  const getMascotasUsuario = async (userId) => {
    setWarn("");
    try {
      const token = getToken();
      if (!token) return setWarn("Debes iniciar sesión para ver mascotas.");
      const data = await fetchJSON(`${BASE_URL}/api/usuarios/${userId}/mascotas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMascotasUsuario(data.mascotas || []);
    } catch (error) {
      setWarn(`No se pudieron cargar las mascotas: ${error.message}`);
    }
  };

  // --- Productos ---
  const getProductos = async () => {
    setWarn("");
    const isServerOnline = await checkServerHealth();
    if (!isServerOnline) return setProductos([]);
    try {
      const data = await fetchJSON(`${BASE_URL}/api/productos`);
      setProductos(data);
    } catch (error) {
      setWarn(`No se pudieron cargar los productos: ${error.message}`);
    }
  };

  const getCategorias = async () => {
    try {
      const data = await fetchJSON(`${BASE_URL}/api/productos/categorias/disponibles`);
      setCategorias(data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
      // Fallback a categorías predeterminadas
      setCategorias([
        { value: 'alimento', label: 'Alimento' },
        { value: 'juguetes', label: 'Juguetes' },
        { value: 'medicamentos', label: 'Medicamentos' },
        { value: 'accesorios', label: 'Accesorios' },
        { value: 'higiene', label: 'Higiene' },
        { value: 'otros', label: 'Otros' }
      ]);
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    const isServerOnline = await checkServerHealth();
    if (!isServerOnline) {
      alert("❌ El servidor no está disponible.");
      return;
    }
    try {
      const token = getToken();
      if (!token) return alert("Debes iniciar sesión como admin.");
      await fetchJSON(`${BASE_URL}/api/productos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("🗑️ Producto eliminado con éxito");
      getProductos();
    } catch (error) {
      alert(`❌ Error al eliminar: ${error.message}`);
    }
  };

  // --- Citas ---
  const getCitas = async () => {
    setWarn("");
    const isServerOnline = await checkServerHealth();
    if (!isServerOnline) return setCitas([]);
    try {
      const token = getToken();
      if (!token) return setWarn("Debes iniciar sesión como admin.");
      const me = await fetchJSON(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (me?.role !== "admin") return setWarn("Tu usuario no es admin.");
      const data = await fetchJSON(`${BASE_URL}/api/citas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCitas(data);
    } catch (error) {
      setWarn(`No se pudieron cargar las citas: ${error.message}`);
    }
  };

  // --- Utility Functions ---
  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    return new Date(fecha).toLocaleDateString('es-CO');
  };

  // --- Effects ---
  useEffect(() => {
    checkServerHealth();
    getCategorias();
  }, []);

  useEffect(() => {
    if (activeTab === "verUsuarios") getUsuarios();
    if (activeTab === "verProductos") getProductos();
    if (activeTab === "verCitas") getCitas();
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
    };
  }, [previewImage]);

  const sidebarItems = [
    { id: "productos", label: isEditMode ? "Editar Producto" : "Crear Producto", icon: Plus },
    { id: "verProductos", label: "Ver Productos", icon: Package },
    { id: "verUsuarios", label: "Ver Usuarios", icon: Users },
    { id: "verCitas", label: "Ver Citas", icon: Calendar },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Sidebar Moderno */}
      <aside className="w-80 bg-white shadow-xl border-r border-gray-200">
        <div className="p-8">
          {/* Header del Admin */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-lime-400 to-lime-500 rounded-2xl flex items-center justify-center">
                <Settings className="text-black" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
                <p className="text-sm text-gray-500">Gestión del sistema</p>
              </div>
            </div>

            {/* Status del servidor */}
            <div
              className={`px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-3 ${
                serverStatus === "online"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : serverStatus === "offline"
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-yellow-50 text-yellow-800 border border-yellow-200"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                serverStatus === "online" ? "bg-green-500" : 
                serverStatus === "offline" ? "bg-red-500" : "bg-yellow-500"
              }`} />
              {serverStatus === "online" && "🟢 Servidor Online"}
              {serverStatus === "offline" && "🔴 Servidor Offline"}
              {serverStatus === "checking" && "🟡 Verificando..."}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== "productos" && isEditMode) {
                      cancelEdit();
                    }
                  }}
                  className={`w-full text-left px-4 py-4 rounded-2xl transition-all duration-200 flex items-center gap-3 font-medium ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-lime-400 to-lime-500 text-black shadow-lg"
                      : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Panel de Administración
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-lime-400 to-lime-500 rounded-full"></div>
          </div>

          {warn && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center gap-3">
              <AlertCircle className="text-yellow-600" size={20} />
              <span className="text-yellow-800">{warn}</span>
            </div>
          )}

          {/* Formulario Productos - ACTUALIZADO PARA CREAR/EDITAR */}
          {activeTab === "productos" && (
            <div>
              {/* HEADER CON BOTÓN CANCELAR */}
              {isEditMode && (
                <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold text-blue-800 mb-2 flex items-center gap-3">
                        <Edit3 className="text-blue-600" size={24} />
                        ✏️ Editando: {editingProduct?.nombre}
                      </h3>
                      <p className="text-blue-600">
                        Modifica los campos que desees actualizar
                      </p>
                    </div>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-500 text-white px-6 py-3 rounded-2xl hover:bg-gray-600 transition-colors flex items-center gap-2 font-medium"
                    >
                      <X size={16} />
                      ❌ Cancelar Edición
                    </button>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100 space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Información básica */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-gray-50 to-white p-8 rounded-2xl border border-gray-100">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center">
                        <div className="w-3 h-3 bg-lime-400 rounded-full mr-4"></div>
                        {isEditMode ? "Editar Información Básica" : "Información Básica"}
                      </h3>
                      
                      <div className="space-y-6">
                        <input
                          type="text"
                          name="nombre"
                          placeholder="Nombre del producto"
                          className="w-full border-2 border-gray-200 p-4 rounded-2xl text-lg focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200"
                          onChange={handleChange}
                          value={formData.nombre}
                          required
                        />
                        
                        <textarea
                          name="descripcion"
                          placeholder="Descripción"
                          className="w-full border-2 border-gray-200 p-4 rounded-2xl text-lg resize-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200"
                          rows="3"
                          onChange={handleChange}
                          value={formData.descripcion}
                          required
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="number"
                            name="precio"
                            placeholder="Precio"
                            min="0"
                            step="0.01"
                            className="w-full border-2 border-gray-200 p-4 rounded-2xl text-lg focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200"
                            onChange={handleChange}
                            value={formData.precio}
                            required
                          />
                          <input
                            type="number"
                            name="stock"
                            placeholder="Stock"
                            min="0"
                            className="w-full border-2 border-gray-200 p-4 rounded-2xl text-lg focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200"
                            onChange={handleChange}
                            value={formData.stock}
                          />
                        </div>
                        
                        <select
                          name="categoria"
                          className="w-full border-2 border-gray-200 p-4 rounded-2xl text-lg bg-white focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200"
                          onChange={handleChange}
                          value={formData.categoria}
                          required
                        >
                          {categorias.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            {isEditMode ? "Cambiar imagen (opcional)" : "Imagen del producto"}
                          </label>
                          <input
                            ref={fileRef}
                            type="file"
                            name="imagen"
                            accept="image/*"
                            className="w-full border-2 border-gray-200 p-3 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all duration-200"
                            onChange={handleChange}
                          />
                          {isEditMode && !previewImage && editingProduct?.imagen && (
                            <div className="mt-4">
                              <p className="text-sm text-gray-600 mb-2">Imagen actual:</p>
                              <img
                                src={
                                  editingProduct.imagen.startsWith("http")
                                    ? editingProduct.imagen
                                    : `${BASE_URL}${editingProduct.imagen}`
                                }
                                alt="Imagen actual"
                                className="w-40 h-40 object-cover rounded-2xl shadow-lg"
                              />
                            </div>
                          )}
                        </div>
                        
                        {previewImage && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              {isEditMode ? "Nueva imagen:" : "Vista previa:"}
                            </p>
                            <img
                              src={previewImage}
                              alt="preview"
                              className="w-40 h-40 object-cover rounded-2xl shadow-lg"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Opciones avanzadas */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-gray-50 to-white p-8 rounded-2xl border border-gray-100">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center">
                        <div className="w-3 h-3 bg-lime-400 rounded-full mr-4"></div>
                        Opciones Avanzadas
                      </h3>
                      
                      {/* Envío gratis */}
                      <label className="flex items-center space-x-4 p-4 bg-green-50 rounded-2xl cursor-pointer mb-6 border border-green-100 hover:bg-green-100 transition-colors">
                        <input
                          type="checkbox"
                          name="envioGratis"
                          checked={formData.envioGratis}
                          onChange={handleChange}
                          className="w-5 h-5 text-green-600 rounded"
                        />
                        <Truck className="text-green-600" size={20} />
                        <span className="text-green-800 font-semibold text-lg">🚚 Envío Gratis</span>
                      </label>
                      
                      {/* Descuento */}
                      <div className="p-6 bg-orange-50 rounded-2xl mb-6 border border-orange-100">
                        <label className="flex items-center space-x-4 mb-4 cursor-pointer">
                          <input
                            type="checkbox"
                            name="tieneDescuento"
                            checked={formData.tieneDescuento}
                            onChange={handleChange}
                            className="w-5 h-5 text-orange-600 rounded"
                          />
                          <Tag className="text-orange-600" size={20} />
                          <span className="text-orange-800 font-semibold text-lg">Tiene Descuento</span>
                        </label>
                        
                        {formData.tieneDescuento && (
                          <div className="space-y-4">
                            <input
                              type="number"
                              name="porcentajeDescuento"
                              placeholder="% de descuento"
                              min="1"
                              max="100"
                              className="w-full border-2 border-orange-200 p-3 rounded-2xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                              onChange={handleChange}
                              value={formData.porcentajeDescuento}
                              required={formData.tieneDescuento}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="date"
                                name="fechaInicioDescuento"
                                placeholder="Fecha inicio"
                                className="w-full border-2 border-orange-200 p-3 rounded-2xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                                onChange={handleChange}
                                value={formData.fechaInicioDescuento}
                              />
                              <input
                                type="date"
                                name="fechaFinDescuento"
                                placeholder="Fecha fin"
                                className="w-full border-2 border-orange-200 p-3 rounded-2xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                                onChange={handleChange}
                                value={formData.fechaFinDescuento}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Garantía */}
                      <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                        <label className="flex items-center space-x-4 mb-4 cursor-pointer">
                          <input
                            type="checkbox"
                            name="tieneGarantia"
                            checked={formData.tieneGarantia}
                            onChange={handleChange}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                          <Shield className="text-blue-600" size={20} />
                          <span className="text-blue-800 font-semibold text-lg">Tiene Garantía</span>
                        </label>
                        
                        {formData.tieneGarantia && (
                          <div className="space-y-4">
                            <input
                              type="number"
                              name="mesesGarantia"
                              placeholder="Meses de garantía"
                              min="1"
                              max="120"
                              className="w-full border-2 border-blue-200 p-3 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                              onChange={handleChange}
                              value={formData.mesesGarantia}
                              required={formData.tieneGarantia}
                            />
                            <textarea
                              name="descripcionGarantia"
                              placeholder="Descripción de la garantía"
                              className="w-full border-2 border-blue-200 p-3 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none"
                              rows="2"
                              onChange={handleChange}
                              value={formData.descripcionGarantia}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-lime-400 to-lime-500 text-black py-4 px-8 rounded-2xl text-xl font-bold hover:from-lime-500 hover:to-lime-600 disabled:opacity-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3"
                  disabled={loading || serverStatus !== "online"}
                >
                  <Save size={24} />
                  {loading ? 
                    (isEditMode ? "Actualizando..." : "Subiendo...") : 
                    (isEditMode ? "Actualizar Producto" : "Crear Producto")
                  }
                </button>
              </form>
            </div>
          )}

          {/* Ver Productos - VISTA ACTUALIZADA CON BOTÓN EDITAR */}
          {activeTab === "verProductos" && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Productos</h2>
                <button
                  onClick={getProductos}
                  className="bg-blue-500 text-white px-6 py-3 rounded-2xl hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium shadow-lg"
                >
                  <RefreshCw size={18} />
                  Recargar
                </button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {productos.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Package className="mx-auto text-gray-400 mb-4" size={64} />
                    <p className="text-gray-600 text-xl">No hay productos registrados</p>
                  </div>
                ) : (
                  productos.map((p) => (
                    <div
                      key={p._id}
                      className="bg-white p-6 rounded-2xl shadow-lg flex flex-col border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {p.imagen && (
                        <img
                          src={
                            p.imagen.startsWith("http")
                              ? p.imagen
                              : `${BASE_URL}${p.imagen}`
                          }
                          alt={p.nombre}
                          className="w-full h-48 object-cover rounded-2xl mb-6"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      
                      {/* Header con badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {p.envioGratis && (
                          <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium">
                            <Truck size={12} />
                            Envío Gratis
                          </span>
                        )}
                        {p.descuentoVigente && (
                          <span className="bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium">
                            <Tag size={12} />
                            -{p.descuento.porcentaje}%
                          </span>
                        )}
                        {p.garantia?.tiene && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium">
                            <Shield size={12} />
                            Garantía
                          </span>
                        )}
                        <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-medium">
                          {categorias.find(cat => cat.value === p.categoria)?.label || p.categoria}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 text-xl mb-3">
                        {p.nombre}
                      </h3>
                      
                      {/* Precios */}
                      <div className="mb-4">
                        {p.descuentoVigente ? (
                          <div>
                            <span className="text-2xl font-bold text-green-600">
                              {formatearPrecio(p.precioConDescuento)}
                            </span>
                            <span className="text-sm text-gray-500 line-through ml-2">
                              {formatearPrecio(p.precio)}
                            </span>
                            <div className="text-sm text-green-600 mt-1">
                              Ahorras: {formatearPrecio(p.ahorroDescuento)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-gray-900">
                            {formatearPrecio(p.precio)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm flex-1 mb-4">{p.descripcion}</p>
                      
                      {/* Información adicional */}
                      <div className="space-y-2 text-sm text-gray-600 mb-6">
                        <div className="flex justify-between">
                          <span>Stock:</span>
                          <span className={p.stock <= 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                            {p.stock || 0} unidades
                          </span>
                        </div>
                        
                        {p.garantia?.tiene && (
                          <div className="flex justify-between">
                            <span>Garantía:</span>
                            <span className="font-medium">{p.garantia.meses} meses</span>
                          </div>
                        )}
                        
                        {p.descuento?.tiene && (
                          <div className="text-xs">
                            <div className="flex justify-between">
                              <span>Descuento:</span>
                              <span className="font-medium">{p.descuento.porcentaje}%</span>
                            </div>
                            {p.descuento.fechaInicio && (
                              <div className="text-gray-500">
                                Desde: {formatearFecha(p.descuento.fechaInicio)}
                              </div>
                            )}
                            {p.descuento.fechaFin && (
                              <div className="text-gray-500">
                                Hasta: {formatearFecha(p.descuento.fechaFin)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* BOTONES DE ACCIÓN ACTUALIZADOS */}
                      <div className="mt-auto space-y-3">
                        <p className="text-xs text-gray-400 text-center">ID: {p._id}</p>
                        
                        {/* NUEVO BOTÓN EDITAR */}
                        <button
                          onClick={() => startEditProduct(p)}
                          className="w-full bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2 shadow-md"
                        >
                          <Edit3 size={16} />
                          Editar
                        </button>
                        
                        <button
                          onClick={() => eliminarProducto(p._id)}
                          className="w-full bg-red-500 text-white px-4 py-3 rounded-xl hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2 shadow-md"
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Ver Usuarios */}
          {activeTab === "verUsuarios" && !selectedUser && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Usuarios</h2>
                <button
                  onClick={getUsuarios}
                  className="bg-blue-500 text-white px-6 py-3 rounded-2xl hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium shadow-lg"
                >
                  <RefreshCw size={18} />
                  Recargar
                </button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {usuarios.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Users className="mx-auto text-gray-400 mb-4" size={64} />
                    <p className="text-gray-600 text-xl">No hay usuarios registrados</p>
                  </div>
                ) : (
                  usuarios.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => {
                        setSelectedUser(u);
                        setActiveTab("detalleUsuario");
                        getMascotasUsuario(u._id);
                      }}
                      className="bg-white p-6 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center">
                          <Users className="text-white" size={20} />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {u.role?.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{u.name}</h3>
                      <p className="text-gray-600 mb-4">{u.email}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Mascotas:</span>
                        <span className="font-semibold text-gray-900">{u.totalMascotas || 0}</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                          <Eye size={16} />
                          <span className="text-sm font-medium">Ver detalles</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Ver Citas */}
          {activeTab === "verCitas" && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Citas</h2>
                <button
                  onClick={getCitas}
                  className="bg-blue-500 text-white px-6 py-3 rounded-2xl hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium shadow-lg"
                >
                  <RefreshCw size={18} />
                  Recargar
                </button>
              </div>
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {citas.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Calendar className="mx-auto text-gray-400 mb-4" size={64} />
                    <p className="text-gray-600 text-xl">No hay citas registradas</p>
                  </div>
                ) : (
                  citas.map((c) => (
                    <div
                      key={c._id}
                      className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="font-bold text-gray-900 text-xl mb-1">
                            {c.usuario?.name || "Usuario no especificado"}
                          </h3>
                          <p className="text-gray-600">{c.usuario?.email}</p>
                        </div>
                        <span className={`px-3 py-2 rounded-full text-xs font-medium ${
                          c.estado === "confirmada" ? "bg-green-100 text-green-800" :
                          c.estado === "pendiente" ? "bg-yellow-100 text-yellow-800" :
                          c.estado === "cancelada" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {c.estado?.toUpperCase() || "PENDIENTE"}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-gray-50 p-3 rounded-xl">
                            <span className="font-semibold text-gray-700 block mb-1">Fecha:</span>
                            <p className="text-gray-900">{c.fecha ? new Date(c.fecha).toLocaleDateString() : "No especificada"}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-xl">
                            <span className="font-semibold text-gray-700 block mb-1">Hora:</span>
                            <p className="text-gray-900">{c.hora || "No especificada"}</p>
                          </div>
                        </div>

                        {c.mascota && (
                          <div className="bg-blue-50 p-3 rounded-xl">
                            <span className="font-semibold text-blue-700 block mb-1">Mascota:</span>
                            <p className="text-blue-900">{c.mascota.nombre} ({c.mascota.especie})</p>
                          </div>
                        )}

                        {c.motivo && (
                          <div className="bg-purple-50 p-3 rounded-xl">
                            <span className="font-semibold text-purple-700 block mb-1">Motivo:</span>
                            <p className="text-purple-900">{c.motivo}</p>
                          </div>
                        )}

                        {c.notas && (
                          <div className="bg-orange-50 p-3 rounded-xl">
                            <span className="font-semibold text-orange-700 block mb-1">Notas:</span>
                            <p className="text-orange-900">{c.notas}</p>
                          </div>
                        )}

                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-400">ID: {c._id}</p>
                          {c.createdAt && (
                            <p className="text-xs text-gray-400">Creada: {new Date(c.createdAt).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Detalle Usuario */}
          {activeTab === "detalleUsuario" && selectedUser && (
            <div>
              <button
                onClick={() => {
                  setActiveTab("verUsuarios");
                  setSelectedUser(null);
                }}
                className="mb-8 bg-gray-200 px-6 py-3 rounded-2xl hover:bg-gray-300 transition-colors flex items-center gap-2 font-medium"
              >
                <ArrowLeft size={18} />
                Volver a Usuarios
              </button>

              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Mascotas de {selectedUser.name}
              </h2>

              <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
                {mascotasUsuario.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
                    <Activity className="mx-auto text-gray-400 mb-4" size={64} />
                    <p className="text-gray-600 text-xl">
                      Este usuario no tiene mascotas registradas
                    </p>
                  </div>
                ) : (
                  mascotasUsuario.map((m) => (
                    <div
                      key={m._id}
                      className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-bold text-gray-900 text-2xl">{m.nombre}</h3>
                          <p className="text-gray-600 text-lg">{m.especie} • {m.raza}</p>
                        </div>
                        {m.imagen && (
                          <img
                            src={
                              m.imagen.startsWith("http")
                                ? m.imagen
                                : `${BASE_URL}${m.imagen}`
                            }
                            alt={m.nombre}
                            className="w-24 h-24 object-cover rounded-2xl shadow-lg"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        )}
                      </div>

                      {/* Información básica */}
                      <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700 block mb-1">Edad:</span>
                            <p className="text-gray-900">{m.edad ? `${m.edad} años` : "No especificada"}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700 block mb-1">Género:</span>
                            <p className="text-gray-900">{m.genero || "No especificado"}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700 block mb-1">Estado:</span>
                            <p className="text-gray-900">{m.estado || "No especificado"}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700 block mb-1">Enfermedades:</span>
                            <p className="text-gray-900">{m.enfermedades || "Ninguna"}</p>
                          </div>
                        </div>
                        {m.historial && (
                          <div className="mt-6">
                            <span className="font-semibold text-gray-700 block mb-2">Historial:</span>
                            <p className="text-gray-900">{m.historial}</p>
                          </div>
                        )}
                      </div>

                      {/* Sección de vacunas */}
                      <div className="mb-8">
                        <h4 className="font-semibold text-green-700 mb-4 text-xl">Vacunas</h4>
                        {m.vacunas && m.vacunas.length > 0 ? (
                          <div className="space-y-3 mb-6">
                            {m.vacunas.map((v, idx) => (
                              <div key={idx} className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                                <span className="font-medium text-green-800">{v.nombre}</span>
                                <span className="text-green-600 text-sm">{new Date(v.fecha).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 mb-6">No hay vacunas registradas</p>
                        )}
                        <form
                          className="grid grid-cols-1 md:grid-cols-3 gap-3"
                          onSubmit={(e) => handleAgregarVacuna(e, m._id)}
                        >
                          <input
                            type="text"
                            name="nombre"
                            placeholder="Nombre vacuna"
                            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400"
                            required
                          />
                          <input
                            type="date"
                            name="fecha"
                            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400"
                            required
                          />
                          <button
                            type="submit"
                            className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 text-sm font-medium transition-colors"
                          >
                            Agregar Vacuna
                          </button>
                        </form>
                      </div>

                      {/* Sección de operaciones */}
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-4 text-xl">Operaciones</h4>
                        {m.operaciones && m.operaciones.length > 0 ? (
                          <div className="space-y-4 mb-6">
                            {m.operaciones.map((op, idx) => (
                              <div key={idx} className="p-4 bg-blue-50 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium text-blue-800">{op.nombre}</span>
                                  <span className="text-blue-600 text-sm">{new Date(op.fecha).toLocaleDateString()}</span>
                                </div>
                                <p className="text-blue-700 text-sm">{op.descripcion}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 mb-6">No hay operaciones registradas</p>
                        )}
                        <form
                          className="space-y-3"
                          onSubmit={(e) => handleAgregarOperacion(e, m._id)}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              name="nombre"
                              placeholder="Nombre operación"
                              className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                              required
                            />
                            <input
                              type="date"
                              name="fecha"
                              className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                              required
                            />
                          </div>
                          <textarea
                            name="descripcion"
                            placeholder="Descripción de la operación"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            rows="3"
                            required
                          />
                          <button
                            type="submit"
                            className="w-full bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 text-sm font-medium transition-colors"
                          >
                            Agregar Operación
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
                            