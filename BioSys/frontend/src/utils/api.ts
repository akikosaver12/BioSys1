import axios from 'axios';

// Configuración centralizada de Axios
// Si cambias la URL del backend, solo cambias aquí
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'https://biosys1.onrender.com/api',  // URL base del backend
  timeout: 10000,                        // 10 segundos de timeout
});

export default api;