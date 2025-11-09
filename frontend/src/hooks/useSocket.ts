import { useEffect, useRef, useState } from 'react';
import websocketService from '../services/websocketService';
import { Socket } from 'socket.io-client';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    try {
      const socket = websocketService.connect();
      socketRef.current = socket;

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        websocketService.disconnect();
      };
    } catch (error) {
      console.error('Failed to connect socket:', error);
    }
  }, []);

  return { socket: socketRef.current, isConnected };
};

