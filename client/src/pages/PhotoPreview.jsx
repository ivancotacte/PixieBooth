import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

const PhotoPreview = ({ capturedImages }) => {
	const [stripColor, setStripColor] = useState("white");
	const stripCanvasRef = useRef(null);
    const navigate = useNavigate();

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

				ctx.fillStyle = stripColor === "black" ? "#FFFFFF" : "#000000";
				ctx.font = "30px Poppins";
				ctx.textAlign = "center";
				ctx.fillText("", canvas.width / 2, totalHeight - borderSize);
			};
		});
	}, [capturedImages, stripColor]);

	useEffect(() => {
		if (capturedImages.length === 4) {
			setTimeout(generatePhotoStrip, 100);
		}
	}, [capturedImages, generatePhotoStrip]);

	const downloadPhotoStrip = () => {
		const link = document.createElement("a");
		link.download = "digibooth_ivancotacte.png";
		link.href = stripCanvasRef.current.toDataURL("image/png");
		link.click();
	};

	return (
		<div className="flex min-h-full flex-1 flex-col justify-center px-6 py-6 lg:px-8">
			<div className="flex flex-col items-center">
				<div className="flex flex-col items-center">
					<canvas ref={stripCanvasRef} className="w-[30vh] md:w-[40vh] border dark:border-white" />
				</div>

                <div className="flex flex-col items-center mt-6">
                    <h6 className="text-muted-foreground text-lg">Select background color</h6>
                    <div className="flex mt-2">
                        <button
                            className={`w-8 h-8 rounded-full border border-black`}
                            style={{ backgroundColor: "white" }}
                            onClick={() => setStripColor("white")}
                        />
                        <button
                            className={`w-8 h-8 rounded-full border border-black`}
                            style={{ backgroundColor: "black" }}
                            onClick={() => setStripColor("black")}
                        />
                        <button
                            className="w-8 h-8 rounded-full border border-black"
                            style={{ backgroundColor: "#f6d5da" }}
                            onClick={() => setStripColor("#f6d5da")}
                        >
                        </button>
                        <button
                            className="w-8 h-8 rounded-full border border-black"
                            style={{ backgroundColor: "#dde6d5" }}
                            onClick={() => setStripColor("#dde6d5")}
                        >
                        </button>
                        <button
                            className="w-8 h-8 rounded-full border border-black"
                            style={{ backgroundColor: "#adc3e5" }}
                            onClick={() => setStripColor("#adc3e5")}
                        >
                        </button>
                        <button
                            className="w-8 h-8 rounded-full border border-black"
                            style={{ backgroundColor: "#FFF2CC" }}
                            onClick={() => setStripColor("#FFF2CC")}
                        >
                        </button>
                        <button
                            className="w-8 h-8 rounded-full border border-black"
                            style={{ backgroundColor: "#dbcfff" }}
                            onClick={() => setStripColor("#dbcfff")}
                        >
                        </button>
                        <input
                            type="color"
                            className="w-8 h-8 rounded-full border border-black"
                            value={stripColor}
                            onChange={(e) => setStripColor(e.target.value)}
                        />
                    </div>
                    <div className="mt-4 flex gap-4">
                        <button 
                            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full" 
                            onClick={() => navigate("/photobooth")}>
                            Retake
                        </button>
                        <button 
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full" 
                            onClick={downloadPhotoStrip}>
                            Save Image
                        </button>
                    </div>
                </div>
			</div>
		</div>
	);
};

export default PhotoPreview;