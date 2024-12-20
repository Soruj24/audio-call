import express from 'express';
import http from 'http';
import { Server as socketIo } from 'socket.io';

// Create an express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server
const io = new socketIo(server);

// When a user connects to the server
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    // Listen for incoming call requests (initiate a call)
    socket.on('initiate-call', (data: { to: string; offer: string }) => {
        io.to(data.to).emit('receive-call', {
            offer: data.offer,
            callerId: socket.id,
        });
    });

    // Listen for the answer to the call
    socket.on('answer-call', (data: { callerId: string; answer: string }) => {
        io.to(data.callerId).emit('call-answered', {
            answer: data.answer,
            calleeId: socket.id,
        });
    });
});

// Start the server on port 3001
server.listen(3001, () => {
    console.log('Server is running on port 3001');
});
