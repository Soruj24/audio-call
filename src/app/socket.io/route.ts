/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from "next/server";
import { Server } from "socket.io";

// SocketRequest টাইপ ডিফাইনেশন, যেখানে `req` এর মধ্যে `socket` থাকবে
interface SocketRequest extends NextRequest {
    socket: any;
}

export const GET = async (req: SocketRequest) => {
    try {
        // যদি socket ইতিমধ্যে সার্ভারের সাথে সংযুক্ত না থাকে
        if (req.socket && !req.socket.server.io) {
            // নতুন Socket.IO সার্ভার তৈরি
            const io = new Server(req.socket.server, {
                cors: {
                    origin: "*", // সব origin কে অনুমতি দেওয়া হচ্ছে
                    credentials: true, // credentials ব্যবহারের অনুমতি
                },
            });

            // সার্ভারের মধ্যে io সংযুক্ত করা হচ্ছে
            req.socket.server.io = io;

            // WebSocket কানেকশনের জন্য ইভেন্ট হ্যান্ডলার সেটআপ
            io.on("connection", (socket) => {
                console.log("User connected:", socket.id);

                // 'offer' ইভেন্ট হ্যান্ডলিং
                socket.on("offer", ({ offer }) => {
                    socket.broadcast.emit("offer", { offer });
                });

                // 'answer' ইভেন্ট হ্যান্ডলিং
                socket.on("answer", ({ answer }) => {
                    socket.broadcast.emit("answer", { answer });
                });

                // 'ice-candidate' ইভেন্ট হ্যান্ডলিং
                socket.on("ice-candidate", (candidate) => {
                    socket.broadcast.emit("ice-candidate", candidate);
                });

                // কানেকশন বন্ধ হলে
                socket.on("disconnect", () => {
                    console.log("User disconnected:", socket.id);
                });
            });
        }

        // WebSocket সার্ভার সফলভাবে সেটআপ হলে 200 স্ট্যাটাস সহ রেসপন্স
        return new NextResponse(null, { status: 200 });

    } catch (error) {
        // যদি কোনো এরর ঘটে, তা লগ করা এবং 500 স্ট্যাটাস সহ রেসপন্স
        console.error("Error setting up WebSocket server:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
};

// WebSocket রিকোয়েস্টের জন্য body parser বন্ধ করা
export const config = {
    api: {
        bodyParser: false, // WebSocket রিকোয়েস্টের জন্য body parser বন্ধ
    },
};
