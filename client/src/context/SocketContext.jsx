import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl.replace(/\/api\/?$/, '');
  return window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { restaurant, user } = useAuth();

  useEffect(() => {
    const socketInstance = io(getSocketUrl(), {
      auth: { token: localStorage.getItem('menuqr_token') || '' },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (restaurant && restaurant._id) {
        socketInstance.emit('join_restaurant', restaurant._id);
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Refresh socket credentials after owner login/logout, then join only the owner's room.
  useEffect(() => {
    if (!socket) return;
    const token = localStorage.getItem('menuqr_token') || '';
    if ((socket.auth?.token || '') !== token) {
      socket.auth = { ...(socket.auth || {}), token };
      socket.disconnect();
      socket.connect();
    }
    if (restaurant?._id) socket.emit('join_restaurant', restaurant._id);
  }, [socket, restaurant, user]);

  const joinOrderRoom = (orderId) => {
    if (socket && orderId) {
      socket.emit('join_order', orderId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinOrderRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
