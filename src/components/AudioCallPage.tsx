"use client";

import { useRef, useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io('/', {
    path: '/socket.io',
});

console.log("socket", socket);
export default function AudioCall() {
    const [callActive, setCallActive] = useState(false);
    const [callTime, setCallTime] = useState(0);
    const timerRef = useRef<NodeJS.Timer | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const remoteAudio = useRef<HTMLAudioElement | null>(null);

    // Timer for call duration
    useEffect(() => {
        if (callActive) {
            timerRef.current = setInterval(() => setCallTime((prev) => prev + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current as NodeJS.Timeout);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current as NodeJS.Timeout);
        };
    }, [callActive]);

    const startCall = async () => {
        setCallActive(true);
        try {
            // Get user audio
            localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            peerConnection.current = new RTCPeerConnection();

            // Add local stream to connection
            localStream.current.getTracks().forEach((track) => {
                peerConnection.current?.addTrack(track, localStream.current!);
            });

            // Handle remote audio stream
            peerConnection.current.ontrack = (event) => {
                const [remoteStream] = event.streams;
                if (remoteAudio.current) remoteAudio.current.srcObject = remoteStream;
            };

            // Handle ICE candidates
            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("ice-candidate", event.candidate);
                }
            };

            // WebRTC signaling events
            socket.on("offer", async ({ offer }) => {
                await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerConnection.current?.createAnswer();
                await peerConnection.current?.setLocalDescription(answer!);
                socket.emit("answer", { answer });
            });

            socket.on("answer", async ({ answer }) => {
                await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
            });

            socket.on("ice-candidate", (candidate) => {
                peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
            });

            // Create and send offer
            const offer = await peerConnection.current?.createOffer();
            await peerConnection.current?.setLocalDescription(offer!);
            socket.emit("offer", { offer });
        } catch (error) {
            console.error("Error starting call:", error);
        }
    };

    const endCall = () => {
        setCallActive(false);
        setCallTime(0);

        // Stop local stream
        if (localStream.current) {
            localStream.current.getTracks().forEach((track) => track.stop());
        }

        // Close connection
        peerConnection.current?.close();
        peerConnection.current = null;
    };

    return (
        <div className="p-6 rounded bg-slate-600 w-72  shadow-md text-center">
            <div className="mb-4">
                <h1 className="text-2xl font-semibold">Audio Call</h1>
                {callActive && <p>Call Duration: {Math.floor(callTime / 60)}:{callTime % 60}</p>}
            </div>
            <div className="flex items-center justify-center space-x-4">
                {!callActive && (
                    <button
                        onClick={startCall}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                        Start Call
                    </button>
                )}
                {callActive && (
                    <button
                        onClick={endCall}
                        className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                        End Call
                    </button>
                )}
            </div>
            <audio ref={remoteAudio} autoPlay controls className="hidden" />
        </div>
    );
}
