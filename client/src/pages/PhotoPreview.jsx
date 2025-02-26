import { useEffect, useRef, useCallback, useState } from "react";

const PhotoPreview = ({ capturedImages }) => {
    const [stripColor, setStripColor] = useState("white");
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
            
            ctx.fillText("픽시부스", canvas.width / 2, totalHeight - borderSize * 1);
        };
        });
    }, [capturedImages]);

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
                <button className="text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800" onClick={downloadPhotoStrip}>Download Photo Strip</button>
            </div>
        </div>
    );
};

export default PhotoPreview;