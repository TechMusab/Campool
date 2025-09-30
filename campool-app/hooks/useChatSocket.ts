import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useChatSocket(serverUrl: string, token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!token) return;
    const socket = io(serverUrl, { auth: { token } });
    socketRef.current = socket;

    function onConnect() {
      setConnected(true);
      // rejoin rooms after reconnect
      joinedRoomsRef.current.forEach((room) => {
        socket.emit('joinRoom', { rideId: room });
      });
    }
    function onDisconnect() {
      setConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [serverUrl, token]);

  const api = useMemo(() => ({
    connected,
    joinRoom: (rideId: string, ack?: (res: any) => void) => {
      socketRef.current?.emit('joinRoom', { rideId }, (res: any) => {
        if (res?.ok) joinedRoomsRef.current.add(rideId);
        ack?.(res);
      });
    },
    leaveRoom: (rideId: string, ack?: (res: any) => void) => {
      socketRef.current?.emit('leaveRoom', { rideId }, (res: any) => {
        joinedRoomsRef.current.delete(rideId);
        ack?.(res);
      });
    },
    sendMessage: (payload: { rideId: string; text: string }, ack?: (res: any) => void) => {
      socketRef.current?.emit('sendMessage', payload, ack);
    },
    on: (event: string, handler: (...args: any[]) => void) => {
      socketRef.current?.on(event, handler);
    },
    off: (event: string, handler: (...args: any[]) => void) => {
      socketRef.current?.off(event, handler);
    },
  }), [connected]);

  return api;
} 