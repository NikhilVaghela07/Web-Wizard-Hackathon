import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, setAuthToken, clearAuthData, getAuthToken } from '../utils/api';
import socketService from '../utils/socket';
import { toast } from 'react-toastify';

// Initial state
const initialState = {
  user: null,
  token: getAuthToken(),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AuthActionTypes = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActionTypes.AUTH_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case AuthActionTypes.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AuthActionTypes.AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case AuthActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case AuthActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case AuthActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // Verify token with server
          const response = await authAPI.getProfile();
          const user = response.data.user;
          
          dispatch({
            type: AuthActionTypes.AUTH_SUCCESS,
            payload: { user, token },
          });
          
          // Connect socket
          socketService.connect(token);
          
        } catch (error) {
          console.error('Token verification failed:', error);
          clearAuthData();
          dispatch({ type: AuthActionTypes.LOGOUT });
        }
      } else {
        dispatch({ type: AuthActionTypes.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      dispatch({ type: AuthActionTypes.AUTH_START });
      
      const response = await authAPI.register(userData);
      const { user, token } = response.data;
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      setAuthToken(token);
      
      dispatch({
        type: AuthActionTypes.AUTH_SUCCESS,
        payload: { user, token },
      });
      
      // Connect socket
      socketService.connect(token);
      
      toast.success('Registration successful! Welcome to Chatrix!');
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      
      dispatch({
        type: AuthActionTypes.AUTH_FAILURE,
        payload: errorMessage,
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      dispatch({ type: AuthActionTypes.AUTH_START });
      
      const response = await authAPI.login(credentials);
      const { user, token } = response.data;
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      setAuthToken(token);
      
      dispatch({
        type: AuthActionTypes.AUTH_SUCCESS,
        payload: { user, token },
      });
      
      // Connect socket
      socketService.connect(token);
      
      toast.success(`Welcome back, ${user.username}!`);
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      
      dispatch({
        type: AuthActionTypes.AUTH_FAILURE,
        payload: errorMessage,
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Disconnect socket first
      socketService.disconnect();
      
      // Call logout API
      if (state.token) {
        await authAPI.logout();
      }
      
      // Clear local data
      clearAuthData();
      
      dispatch({ type: AuthActionTypes.LOGOUT });
      
      toast.info('You have been logged out');
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still clear local data even if API call fails
      clearAuthData();
      socketService.disconnect();
      dispatch({ type: AuthActionTypes.LOGOUT });
      
      toast.info('You have been logged out');
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AuthActionTypes.CLEAR_ERROR });
  };

  // Update user data
  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    dispatch({
      type: AuthActionTypes.AUTH_SUCCESS,
      payload: { user: updatedUser, token: state.token },
    });
  };

  // Context value
  const contextValue = {
    ...state,
    register,
    login,
    logout,
    clearError,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;