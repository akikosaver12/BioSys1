import axios from 'axios';

// Configuración centralizada de Axios
// Si cambias la URL del backend, solo cambias aquí
const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // URL base del backend
  timeout: 10000,                        // 10 segundos de timeout
});

export default api;