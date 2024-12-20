"use client"
import Peer, { MediaConnection } from 'peerjs';
import socket from '@/lib/socket';
import React, { useEffect, useRef, useState } from 'react';

const AudioCall: React.FC = () => {
    const [callActive, setCallActive] = useState(false);
    const [userStream, setUserStream] = useState<MediaStream | null>(null);
    const [, setRemoteStream] = useState<MediaStream | null>(null);

    const [timeElapsed, setTimeElapsed] = useState(0); // Time in seconds
    const [timerRunning, setTimerRunning] = useState(false);

    const userVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const peer = useRef<Peer | null>(null);
    const currentCall = useRef<MediaConnection | null>(null);

    const timerInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Get user's media stream (audio only)
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                setUserStream(stream);
                if (userVideoRef.current) {
                    userVideoRef.current.srcObject = stream;
                }
            })
            .catch(error => console.error('Error accessing media devices.', error));

        // Initialize PeerJS for peer-to-peer connection
        peer.current = new Peer('some-peer-id', { host: 'localhost', port: 9000, path: '/peerjs' });

        peer.current.on('call', (call) => {
            call.answer(userStream!);
            call.on('stream', (remoteStream) => {
                setRemoteStream(remoteStream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            });
        });

        // Socket.IO listener for receiving calls
        socket.on('receive-call', (data: any) => {
            const { callerId } = data;
            setCallActive(true);
            setTimerRunning(true);
            if (peer.current) {
                const call = peer.current.call(callerId, userStream!);
                currentCall.current = call;
                call.on('stream', (remoteStream) => {
                    setRemoteStream(remoteStream);
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = remoteStream;
                    }
                });
            }
        });

        // Timer logic
        if (timerRunning) {
            timerInterval.current = setInterval(() => {
                setTimeElapsed(prevTime => prevTime + 1); // Increment every second
            }, 1000);
        } else if (!timerRunning && timeElapsed !== 0) {
            clearInterval(timerInterval.current!);
        }

        return () => {
            if (peer.current) peer.current.destroy();
            if (userStream) userStream.getTracks().forEach(track => track.stop());
            if (timerInterval.current) {
                clearInterval(timerInterval.current); // Clean up the interval
            }
        };
    }, [timerRunning, timeElapsed, userStream]);

    // Function to initiate a call
    const initiateCall = () => {
        socket.emit('initiate-call', { to: 'receiverId', offer: 'someOfferData' });
        setCallActive(true);
        setTimerRunning(true);
    };

    // Function to end the call
    const endCall = () => {
        if (currentCall.current) {
            currentCall.current.close(); // Close the call
        }
        setCallActive(false);
        setTimerRunning(false);
        setTimeElapsed(0);
    };

    // Format time in mm:ss
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds}`;
    };

    return (
        <div className="flex flex-col items-center space-y-6 bg-gray-100 p-8 rounded-xl shadow-lg w-full max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-semibold text-gray-800">Audio Call</h2>

            <div className="flex flex-col items-center space-y-4 w-full">
                <div className="flex items-center space-x-4 w-full">
                    <video ref={userVideoRef} autoPlay muted className="w-36 h-36 rounded-full border-4 border-indigo-600 shadow-lg" />
                    <video ref={remoteVideoRef} autoPlay className="w-36 h-36 rounded-full border-4 border-indigo-600 shadow-lg" />
                </div>
                <div className="w-full text-center">
                    <p className="text-lg font-medium text-gray-700">Call Duration</p>
                    <p className="text-3xl font-bold text-indigo-600">{formatTime(timeElapsed)}</p>
                </div>
            </div>

            <div className="flex space-x-4 w-full justify-center">
                {!callActive ? (
                    <button
                        onClick={initiateCall}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-full text-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    >
                        Start Call
                    </button>
                ) : (
                    <>
                        <button
                            onClick={endCall}
                            className="bg-red-600 text-white px-6 py-3 rounded-full text-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                        >
                            End Call
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AudioCall;
