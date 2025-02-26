import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const PhotoBooth = ({ setCapturedImages }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [capturedImages, setImages] = useState([]);
    const [filter, setFilter] = useState("none");
    const [countdown, setCountdown] = useState(null);
    const [capturing, setCapturing] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [autoCapture, setAutoCapture] = useState(false);

    useEffect(() => {
        startCamera();
        const handleVisibilityChange = () => {
        if (!document.hidden) startCamera();
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

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
                            setPreviewMode(true);
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

    // Added reset function to clear images and preview mode
    const resetPhotos = () => {
        setImages([]);
        setPreviewMode(false);
        setCapturedImages([]);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
        const context = canvas.getContext("2d");
        const targetWidth = 1280,
            targetHeight = 720;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const videoRatio = video.videoWidth / video.videoHeight;
        const targetRatio = targetWidth / targetHeight;
        let drawWidth = video.videoWidth,
            drawHeight = video.videoHeight,
            startX = 0,
            startY = 0;
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

    const PhotoPreview = ({ capturedImages }) => {
        const [stripColor] = useState("white");
        const stripCanvasRef = useRef(null);

        const generatePhotoStrip = useCallback(() => {
            const canvas = stripCanvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            const imgWidth = 400,
                imgHeight = 300,
                borderSize = 40,
                photoSpacing = 20,
                textHeight = 50;
            const totalHeight = (imgHeight * 4) + (photoSpacing * 3) + (borderSize * 2) + textHeight;
            canvas.width = imgWidth + borderSize * 2;
            canvas.height = totalHeight;
            ctx.fillStyle = stripColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            capturedImages.forEach((image, index) => {
                const img = new Image();
                img.src = image;
                img.onload = () => {
                    const yOffset = borderSize + (imgHeight + photoSpacing) * index;
                    const imageRatio = img.width / img.height;
                    const targetRatio = imgWidth / imgHeight;
                    let sourceWidth = img.width,
                        sourceHeight = img.height,
                        sourceX = 0,
                        sourceY = 0;
                    if (imageRatio > targetRatio) {
                        sourceWidth = sourceHeight * targetRatio;
                        sourceX = (img.width - sourceWidth) / 2;
                    } else {
                        sourceHeight = sourceWidth / targetRatio;
                        sourceY = (img.height - sourceHeight) / 2;
                    }
                    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, borderSize, yOffset, imgWidth, imgHeight);
                    ctx.fillStyle = stripColor === "black" ? "#FFFFFF" : "#000000";
                    ctx.font = "30px Poppins";
                    ctx.textAlign = "center";
                    ctx.fillText("픽시부스", canvas.width / 2, totalHeight - borderSize);
                };
            });
        }, [capturedImages, stripColor]);

        useEffect(() => {
            if (capturedImages.length === 4) {
                setTimeout(() => generatePhotoStrip(), 100);
            }
        }, [capturedImages, generatePhotoStrip]);

        const downloadPhotoStrip = () => {
            const link = document.createElement("a");
            link.download = "photostrip.png";
            link.href = stripCanvasRef.current.toDataURL("image/png");
            link.click();
        };

        return (
            <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-6 lg:px-8">
                <div className="flex flex-col items-center">
                    <canvas ref={stripCanvasRef} className="photo-strip" />
                    <button
                        className="text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                        onClick={downloadPhotoStrip}>
                        Download Photo Strip
                    </button>
                </div>
            </div>
        );
    };

    if (previewMode) {
        return <PhotoPreview capturedImages={capturedImages} />;
    }

    return (
        <div className="">
            <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-6 lg:px-8">
                <div className="flex flex-col items-center">
                    <div className="relative">
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
                            <button 
                                className="px-7 py-4 bg-black dark:bg-white text-white dark:text-black py-2 px-4 rounded-full mr-2"
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
                            <button 
                                className="bg-black text-white rounded-full p-3 hover:bg-white hover:text-black"
                                onClick={resetPhotos}>
                                {/* Retry vector icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                  <path d="M12 6V2L8 6l4 4V6a6 6 0 100 12 6 6 0 006-6h2a8 8 0 11-8-8z"/>
                                </svg>
                            </button>
                            <p className="mb-0 ml-auto">
                                Capture Images: {capturedImages.length}/4
                            </p>
                        </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="grid grid-cols-2 gap-4 mb-4 md:grid-cols-4">
                    {capturedImages.map((image, index) => (
                    <img key={index} src={image} alt={`Captured ${index + 1}`} className="mt-4 border-2 border-black dark:border-white rounded-md preview" />
                    ))}
                </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoBooth;