/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {

    if (res.socket && !(res.socket as any).server.io) {
        const io = new Server((res.socket as any).server, {
            cors: {
                origin: "*",
                credentials: true,
            },
        });

        // Attach the socket.io server to the Next.js server
        (res.socket as any).server.io = io;

        // Handle socket connections
        io.on("connection", (socket) => {
            console.log("User connected:", socket.id);

            // Offer event
            socket.on("offer", ({ offer }) => {
                socket.broadcast.emit("offer", { offer });
            });

            // Answer event
            socket.on("answer", ({ answer }) => {
                socket.broadcast.emit("answer", { answer });
            });

            // ICE Candidate event
            socket.on("ice-candidate", (candidate) => {
                socket.broadcast.emit("ice-candidate", candidate);
            });

            // Handle disconnection
            socket.on("disconnect", () => {
                console.log("User disconnected:", socket.id);
            });

        });
    }

    res.end();
};

export const config = {
    api: {
        bodyParser: false, // Disable body parser to handle raw socket requests
    },
};

export default SocketHandler;
