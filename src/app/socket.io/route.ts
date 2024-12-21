/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from "next/server";
import { Server } from "socket.io";

interface SocketRequest extends NextRequest {
    socket: any;
}

export const GET = async (req: SocketRequest) => {
    try {
        if (req.socket && !req.socket.server.io) {
            const io = new Server(req.socket.server, {
                cors: {
                    origin: "https://audio-call-eta.vercel.app/",
                    credentials: true,
                },
            });

            req.socket.server.io = io;

            io.on("connection", (socket) => {
                console.log("User connected:", socket.id);

                socket.on("offer", ({ offer }) => {
                    socket.broadcast.emit("offer", { offer });
                });

                socket.on("answer", ({ answer }) => {
                    socket.broadcast.emit("answer", { answer });
                });

                socket.on("ice-candidate", (candidate) => {
                    socket.broadcast.emit("ice-candidate", candidate);
                });

                socket.on("disconnect", () => {
                    console.log("User disconnected:", socket.id);
                });
            });
        }

        return new NextResponse(null, { status: 200 });

    } catch (error) {
        console.error("Error setting up WebSocket server:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
};

export const config = {
    api: {
        bodyParser: false,
    },
};
