import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera, RefreshCw, CheckCircle2, AlertCircle, VideoOff } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  capturedImage: string | null;
  onRetake: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  capturedImage,
  onRetake,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setCameraError(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported by your browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn("Video playback error:", err);
        });
      }
      setIsLoading(false);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setIsLoading(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera hardware detected on this device.");
      } else {
        setCameraError(err.message || "Failed to initialize device camera. Please check permissions.");
      }
    }
  }, [stopStream]);

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [capturedImage, startCamera, stopStream]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Watermark with live timestamp & verification badge
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    ctx.font = "bold 14px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`• LIVE VERIFIED • ${dateStr} ${timeStr}`, 14, canvas.height - 15);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    stopStream();
    onCapture(dataUrl);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full aspect-4/3 max-w-md bg-slate-950 rounded-2xl overflow-hidden shadow-inner border-2 border-slate-800 flex items-center justify-center">
        {capturedImage ? (
          // Captured Preview
          <div className="relative w-full h-full">
            <img
              src={capturedImage}
              alt="Live Selfie Capture"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Selfie Captured
            </div>
          </div>
        ) : (
          // Live Video Feed
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover transform -scale-x-100 ${
                isLoading || cameraError ? "hidden" : "block"
              }`}
            />

            {/* Viewfinder Overlays */}
            {!isLoading && !cameraError && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white inline-block" />
                    LIVE CAMERA
                  </div>
                  <span className="text-[11px] font-mono text-slate-300 bg-slate-900/70 px-2 py-0.5 rounded">
                    FACE ALIGNMENT
                  </span>
                </div>

                {/* Oval outline guide for facial alignment */}
                <div className="self-center w-48 h-56 border-2 border-dashed border-sky-400/70 rounded-full opacity-80" />

                <div className="text-center bg-slate-900/80 backdrop-blur-xs py-1 px-3 rounded-lg text-xs text-slate-300">
                  Position your face clearly within the oval guide
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && !cameraError && (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-xs">Initializing camera feed...</span>
              </div>
            )}

            {/* Camera Error State */}
            {cameraError && (
              <div className="flex flex-col items-center gap-3 p-6 text-center text-slate-200">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <VideoOff className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-rose-400 mb-1">
                    Camera Access Required
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    {cameraError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Camera
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Camera Action Buttons */}
      <div className="mt-4 flex items-center justify-center gap-3 w-full">
        {capturedImage ? (
          <button
            id="retake-selfie-button"
            type="button"
            onClick={onRetake}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retake Selfie
          </button>
        ) : (
          <button
            id="capture-selfie-button"
            type="button"
            disabled={isLoading || !!cameraError}
            onClick={handleCapture}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
            Capture Live Selfie
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
        * As per policy, live camera capture is required. File uploads are disabled.
      </p>
    </div>
  );
};
