/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from "socket.io";
import { NextRequest, NextResponse } from "next/server";

// Handle the WebSocket and signaling connection
export const GET = async (req: NextRequest, res: NextResponse) => {
    try {
        // Ensure the request has socket functionality
        if (res.socket && !res.socket.server.io) {
            const io = new Server(res.socket.server, {
                cors: {
                    origin: "*", // Allow all origins
                    credentials: true, // Enable credentials
                },
            });

            // Attach the socket.io server to the Next.js server instance
            res.socket.server.io = io;

            // Listen for incoming WebSocket connections
            io.on("connection", (socket) => {
                console.log("User connected:", socket.id);

                // Handle 'offer' event
                socket.on("offer", ({ offer }) => {
                    socket.broadcast.emit("offer", { offer });
                });

                // Handle 'answer' event
                socket.on("answer", ({ answer }) => {
                    socket.broadcast.emit("answer", { answer });
                });

                // Handle 'ice-candidate' event
                socket.on("ice-candidate", (candidate) => {
                    socket.broadcast.emit("ice-candidate", candidate);
                });

                // Handle disconnection
                socket.on("disconnect", () => {
                    console.log("User disconnected:", socket.id);
                });
            });
        }

        // Send a successful response to the Next.js server
        return new NextResponse(null, { status: 200 });

    } catch (error) {
        console.error("Error setting up WebSocket server:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
};

// Disable body parsing to handle WebSocket raw data
export const config = {
    api: {
        bodyParser: false, // Disable body parser for raw WebSocket requests
    },
};
