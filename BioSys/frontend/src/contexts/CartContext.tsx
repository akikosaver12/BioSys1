import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Product } from '../hooks/useProducts';

// Extendemos Product para incluir cantidad
interface CartItem extends Product {
  quantity: number;
}

// Estado del carrito
interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isUserLoggedIn: boolean;
  userId: string | null;
}

// Acciones que puede hacer el carrito
type CartAction =
  | { type: 'SET_USER'; payload: { userId: string | null; isLoggedIn: boolean } }
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState }
  | { type: 'LOGOUT_CLEAR' };

// Función para obtener la clave del localStorage específica del usuario
const getUserCartKey = (userId: string) => `veterinary_cart_${userId}`;

// Funciones para localStorage por usuario
const saveCartToStorage = (userId: string, cartState: CartState) => {
  if (!userId) return;
  try {
    localStorage.setItem(getUserCartKey(userId), JSON.stringify(cartState));
  } catch (error) {
    console.error('Error guardando carrito en localStorage:', error);
  }
};

const loadCartFromStorage = (userId: string): CartState | null => {
  if (!userId) return null;
  try {
    const savedCart = localStorage.getItem(getUserCartKey(userId));
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      if (parsedCart.items && Array.isArray(parsedCart.items)) {
        return parsedCart;
      }
    }
  } catch (error) {
    console.error('Error cargando carrito desde localStorage:', error);
  }
  return null;
};

const clearCartFromStorage = (userId: string) => {
  if (!userId) return;
  try {
    localStorage.removeItem(getUserCartKey(userId));
  } catch (error) {
    console.error('Error limpiando carrito de localStorage:', error);
  }
};

// Función para verificar si hay usuario autenticado
const isUserAuthenticated = (): { isLoggedIn: boolean; userId: string | null } => {
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      const userId = user?.id || user?._id || user?.username;
      return {
        isLoggedIn: !!userId,
        userId: userId || null
      };
    }
    return { isLoggedIn: false, userId: null };
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    return { isLoggedIn: false, userId: null };
  }
};

// Crear el contexto
interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addToCart: (product: Product) => boolean;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  handleUserLogout: () => void;
  handleUserLogin: (userId: string) => void;
  isAuthenticated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  let newItems: CartItem[];
  let newState: CartState;

  switch (action.type) {
    case 'SET_USER':
      if (!action.payload.isLoggedIn || !action.payload.userId) {
        // Si no hay usuario, limpiar carrito
        return {
          items: [],
          total: 0,
          itemCount: 0,
          isUserLoggedIn: false,
          userId: null,
        };
      } else {
        // Si hay usuario, cargar su carrito
        const userCart = loadCartFromStorage(action.payload.userId);
        if (userCart) {
          return {
            ...userCart,
            isUserLoggedIn: true,
            userId: action.payload.userId,
          };
        }
        return {
          items: [],
          total: 0,
          itemCount: 0,
          isUserLoggedIn: true,
          userId: action.payload.userId,
        };
      }

    case 'ADD_TO_CART': {
      if (!state.isUserLoggedIn || !state.userId) {
        return state; // No hacer nada si no hay usuario logueado
      }

      const existingItem = state.items.find(item => item._id === action.payload._id);

      if (existingItem) {
        newItems = state.items.map(item =>
          item._id === action.payload._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }];
      }

      newState = {
        ...state,
        items: newItems,
        total: newItems.reduce((sum, item) => sum + item.precio * item.quantity, 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      };

      // Guardar en localStorage
      if (state.userId) {
        saveCartToStorage(state.userId, newState);
      }

      return newState;
    }

    case 'REMOVE_FROM_CART': {
      if (!state.isUserLoggedIn || !state.userId) {
        return state;
      }

      newItems = state.items.filter(item => item._id !== action.payload);
      newState = {
        ...state,
        items: newItems,
        total: newItems.reduce((sum, item) => sum + item.precio * item.quantity, 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      };

      // Guardar en localStorage
      if (state.userId) {
        saveCartToStorage(state.userId, newState);
      }

      return newState;
    }

    case 'UPDATE_QUANTITY': {
      if (!state.isUserLoggedIn || !state.userId) {
        return state;
      }

      newItems = state.items
        .map(item =>
          item._id === action.payload.id
            ? { ...item, quantity: Math.max(0, action.payload.quantity) }
            : item
        )
        .filter(item => item.quantity > 0);

      newState = {
        ...state,
        items: newItems,
        total: newItems.reduce((sum, item) => sum + item.precio * item.quantity, 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      };

      // Guardar en localStorage
      if (state.userId) {
        saveCartToStorage(state.userId, newState);
      }

      return newState;
    }

    case 'CLEAR_CART':
    case 'LOGOUT_CLEAR':
      newState = {
        ...state,
        items: [],
        total: 0,
        itemCount: 0,
      };

      // Limpiar localStorage si hay userId
      if (state.userId) {
        clearCartFromStorage(state.userId);
      }

      return newState;

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
};

// Estado inicial
const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isUserLoggedIn: false,
  userId: null,
};

// Proveedor del contexto con detección automática de usuario
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);

  // Verificar autenticación y sincronizar usuario
  useEffect(() => {
    const checkAndSyncUser = () => {
      const { isLoggedIn, userId } = isUserAuthenticated();
      setIsAuthenticated(isLoggedIn);
      
      // Solo sincronizar si el estado cambió
      if (state.isUserLoggedIn !== isLoggedIn || state.userId !== userId) {
        dispatch({ 
          type: 'SET_USER', 
          payload: { userId, isLoggedIn } 
        });
      }
    };

    // Verificar inmediatamente
    checkAndSyncUser();

    // Verificar cada 2 segundos
    const authCheckInterval = setInterval(checkAndSyncUser, 2000);

    return () => clearInterval(authCheckInterval);
  }, [state.isUserLoggedIn, state.userId]);

  // Detectar cambios en el localStorage desde otras pestañas/ventanas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        const { isLoggedIn, userId } = isUserAuthenticated();
        setIsAuthenticated(isLoggedIn);
        dispatch({ 
          type: 'SET_USER', 
          payload: { userId, isLoggedIn } 
        });
      }
    };

    // Escuchar evento personalizado para cambios en la misma pestaña
    const handleCustomStorageChange = () => {
      const { isLoggedIn, userId } = isUserAuthenticated();
      setIsAuthenticated(isLoggedIn);
      dispatch({ 
        type: 'SET_USER', 
        payload: { userId, isLoggedIn } 
      });
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userChanged', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleCustomStorageChange);
    };
  }, []);

  // Funciones auxiliares con verificación de autenticación
  const addToCart = (product: Product): boolean => {
    if (isAuthenticated && state.isUserLoggedIn) {
      dispatch({ type: 'ADD_TO_CART', payload: product });
      return true;
    } else {
      alert('Debes iniciar sesión para agregar productos al carrito');
      return false;
    }
  };

  const removeFromCart = (id: string) => {
    if (isAuthenticated && state.isUserLoggedIn) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: id });
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (isAuthenticated && state.isUserLoggedIn) {
      if (quantity <= 0) {
        removeFromCart(id);
      } else {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
      }
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Función para manejar cierre de sesión
  const handleUserLogout = () => {
    dispatch({ type: 'LOGOUT_CLEAR' });
    setIsAuthenticated(false);
  };

  // Función para manejar inicio de sesión
  const handleUserLogin = (userId: string) => {
    dispatch({ 
      type: 'SET_USER', 
      payload: { userId, isLoggedIn: true } 
    });
    setIsAuthenticated(true);
  };

  const value: CartContextType = {
    state,
    dispatch,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    handleUserLogout,
    handleUserLogin,
    isAuthenticated,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook personalizado para usar el carrito
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};

// Hook para obtener el número de items
export const useCartItemCount = (): number => {
  const { state } = useCart();
  return state.itemCount;
};

// Hook para verificar si un producto está en el carrito
export const useIsInCart = (productId: string): boolean => {
  const { state } = useCart();
  return state.items.some(item => item._id === productId);
};

// Hook para obtener la cantidad de un producto específico
export const useProductQuantity = (productId: string): number => {
  const { state } = useCart();
  const item = state.items.find(item => item._id === productId);
  return item ? item.quantity : 0;
};

// Hook para verificar si el usuario está autenticado
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useCart();
  return isAuthenticated;
};

// Exportar tipos
export type { CartItem };