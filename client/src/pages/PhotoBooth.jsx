import { useRef, useState, useEffect, useCallback } from "react";
import PhotoPreview from "./PhotoPreview";

const PhotoBooth = ({ setCapturedImages }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState("");
    const [capturedImages, setImages] = useState([]);
    const [filter, setFilter] = useState("none");
    const [countdown, setCountdown] = useState(null);
    const [capturing, setCapturing] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [autoCapture, setAutoCapture] = useState(false);

    useEffect(() => {
        document.title = 'Digibooth';
    }, []);

    useEffect(() => {
        const fetchCameras = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === "videoinput");
            setCameras(videoDevices);
            if (videoDevices.length && !selectedCamera) {
            setSelectedCamera(videoDevices[0].deviceId);
            }
        }
        };
        fetchCameras();
    }, [selectedCamera]);

    useEffect(() => {
        startCamera();
        const handleVisibilityChange = () => {
        if (!document.hidden) startCamera();
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [selectedCamera]);

    useEffect(() => {
        if (autoCapture && !capturing && capturedImages.length < 4) {
        const timer = setTimeout(() => startCountdown(), 1000);
        return () => clearTimeout(timer);
        }
    }, [autoCapture, capturing, capturedImages]);

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera API is not supported in this browser.");
        return;
        }
        try {
        if (videoRef.current && videoRef.current.srcObject) return;
        const constraints = {
            video: {
            deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
            facingMode: "user",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
            }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            videoRef.current.style.transform = "scaleX(-1)";
            videoRef.current.style.objectFit = "cover";
        }
        } catch (error) {
        console.error("Error accessing camera:", error);
        }
    };

    const startCountdown = () => {
        if (capturing) return;
        setCapturing(true);
        let timeLeft = 3;
        setCountdown(timeLeft);
        const timer = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        if (timeLeft === 0) {
            clearInterval(timer);
            const imageUrl = capturePhoto();
            if (imageUrl) {
            setImages(prev => {
                const newImages = [...prev, imageUrl];
                if (newImages.length === 4) {
                setCapturedImages(newImages);
                }
                return newImages;
            });
            }
            setCountdown(null);
            setCapturing(false);
        }
        }, 1000);
    };

    const toggleAutoCapture = () => {
        if (autoCapture) {
        setAutoCapture(false);
        } else {
        setAutoCapture(true);
        if (!capturing) startCountdown();
        }
    };

    const resetPhotos = () => {
        setImages([]);
        setPreviewMode(false);
        setCapturedImages([]);
        setAutoCapture(false);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
        const context = canvas.getContext("2d");
        const targetWidth = 1280, targetHeight = 720;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const videoRatio = video.videoWidth / video.videoHeight;
        const targetRatio = targetWidth / targetHeight;
        let drawWidth = video.videoWidth, drawHeight = video.videoHeight, startX = 0, startY = 0;
        if (videoRatio > targetRatio) {
            drawWidth = drawHeight * targetRatio;
            startX = (video.videoWidth - drawWidth) / 2;
        } else {
            drawHeight = drawWidth / targetRatio;
            startY = (video.videoHeight - drawHeight) / 2;
        }
        context.save();
        context.filter = filter !== "none" ? filter : "none";
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, startX, startY, drawWidth, drawHeight, 0, 0, targetWidth, targetHeight);
        context.restore();
        return canvas.toDataURL("image/png");
        }
    };

    const CapturedImage = ({ src, alt }) => {
        const [loaded, setLoaded] = useState(false);
        return (
        <img
            src={src}
            alt={alt}
            onLoad={() => setLoaded(true)}
            className={`mt-4 border-2 border-black dark:border-white rounded-md preview transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
        );
    };

    if (previewMode) {
        return <PhotoPreview capturedImages={capturedImages} />;
    }

    return (
        <div>
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-6 lg:px-8">
            <div className="flex flex-col items-center">
            <div className="relative">
                <div className="top-0 left-0 mt-4 flex items-center space-x-2">
                <select
                    value={selectedCamera}
                    onChange={(e) => {
                    setSelectedCamera(e.target.value);
                    if (videoRef.current && videoRef.current.srcObject) {
                        const tracks = videoRef.current.srcObject.getTracks();
                        tracks.forEach(track => track.stop());
                        videoRef.current.srcObject = null;
                    }
                    }}
                    className="mb-4 p-2 rounded">
                    {cameras.map((cam) => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label || "Camera"}
                    </option>
                    ))}
                </select>
                </div>
                <video
                ref={videoRef}
                onClick={startCountdown}
                disabled={capturing}
                autoPlay
                style={{ filter }}
                className="video-feed"
                />
                {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center text-4xl text-white bounce-animation">
                    {countdown}
                </div>
                )}
                <div className="bottom-0 left-0 mt-4 flex items-center space-x-2">
                {capturedImages.length === 4 ? (
                    <button
                    className="px-12 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full"
                    onClick={() => setPreviewMode(true)}>
                    Next
                    </button>
                ) : (
                    <>
                    <button
                        className="px-7 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full mr-2"
                        onClick={startCountdown}
                        disabled={capturing}>
                        {capturing ? "Capturing..." : "Capture Image"}
                    </button>
                    <button
                        className="px-7 py-4 text-white bg-gray-800 hover:bg-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700 rounded-full"
                        onClick={toggleAutoCapture}
                        disabled={capturing && !autoCapture}>
                        {autoCapture ? "Stop Auto Capture" : "Auto Capture"}
                    </button>
                    </>
                )}
                <button
                    className="bg-black text-white rounded-full p-3 hover:bg-white hover:text-black"
                    onClick={resetPhotos}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 6V2L8 6l4 4V6a6 6 0 100 12 6 6 0 006-6h2a8 8 0 11-8-8z" />
                    </svg>
                </button>
                <p className="mb-0 ml-auto">
                    Capture Images: {capturedImages.length}/4
                </p>
                </div>
                <div className="bottom-0 left-0 mt-4 flex items-center space-x-2">
                <button
                    className="bg-black text-white rounded-full p-3 hover:bg-white hover:text-black"
                    onClick={() => setFilter(prev => prev === "none" ? "grayscale(100%)" : "none")}
                    disabled={capturing}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line x1="7" y1="3" x2="7" y2="21" stroke="currentColor" strokeWidth="2" />
                    <line x1="17" y1="3" x2="17" y2="21" stroke="currentColor" strokeWidth="2" />
                    </svg>
                </button>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="grid grid-cols-2 gap-4 mb-4 md:grid-cols-4">
                {capturedImages.map((image, index) => (
                <CapturedImage key={index} src={image} alt={`Captured ${index + 1}`} />
                ))}
            </div>
            </div>
        </div>
        </div>
    );
};

export default PhotoBooth;