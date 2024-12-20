// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('A user connected');
  
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

  // Listen for incoming call requests
  socket.on('initiate-call', (data) => {
    io.to(data.to).emit('receive-call', {
      offer: data.offer,
      callerId: socket.id,
    });
  });

  // Listen for answer
  socket.on('answer-call', (data) => {
    io.to(data.callerId).emit('call-answered', {
      answer: data.answer,
      calleeId: socket.id,
    });
  });
});

server.listen(3001, () => {
  console.log('Server is running on port 3001');
});
