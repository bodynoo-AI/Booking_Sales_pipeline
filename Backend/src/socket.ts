import { Server, Namespace } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let bkgNamespace: Namespace | null = null;

export const initSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  bkgNamespace = io.of('/bkg');
  bkgNamespace.on('connection', (socket) => {
    console.log('[BKG Socket] Client connected', socket.id);

    socket.on('disconnect', () => {
      console.log('[BKG Socket] Client disconnected', socket.id);
    });
  });

  return bkgNamespace;
};

export const getBkgNamespace = () => bkgNamespace;

export const emitBkgEvent = (event: string, payload: unknown) => {
  if (!bkgNamespace) return;
  bkgNamespace.emit(event, payload);
};
