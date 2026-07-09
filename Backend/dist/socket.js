"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitBkgEvent = exports.getBkgNamespace = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let bkgNamespace = null;
const initSocket = (server) => {
    const io = new socket_io_1.Server(server, {
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
exports.initSocket = initSocket;
const getBkgNamespace = () => bkgNamespace;
exports.getBkgNamespace = getBkgNamespace;
const emitBkgEvent = (event, payload) => {
    if (!bkgNamespace)
        return;
    bkgNamespace.emit(event, payload);
};
exports.emitBkgEvent = emitBkgEvent;
