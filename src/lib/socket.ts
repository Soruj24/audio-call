// lib/socket.ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001'); // Socket server URL

export default socket;