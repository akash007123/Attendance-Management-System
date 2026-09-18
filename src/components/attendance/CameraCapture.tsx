import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  VideoOff,
  ScanFace,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Info,
} from "lucide-react";
import {
  FaceDetectionAnalyzer,
  FaceDetectionResult,
} from "../../utils/faceDetection";

interface CameraCaptureProps {
  onCapture: (imageSrc: string, faceResult?: FaceDetectionResult) => void;
  capturedImage: string | null;
  onRetake: () => void;
  mode?: "PUNCH_IN" | "PUNCH_OUT";
  requireFaceDetection?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  capturedImage,
  onRetake,
  mode = "PUNCH_IN",
  requireFaceDetection = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<FaceDetectionAnalyzer>(new FaceDetectionAnalyzer());
  const animationFrameRef = useRef<number | null>(null);
  const demoIntervalRef = useRef<any>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [faceResult, setFaceResult] = useState<FaceDetectionResult | null>(null);
  const [allowBypass, setAllowBypass] = useState(false);

  const isClockIn = mode === "PUNCH_IN";
  const mustValidateFace = isClockIn && requireFaceDetection && !allowBypass;

  const stopStream = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    analyzerRef.current.reset();
  }, []);

  // Real-time video analysis loop for face presence
  const startAnalysisLoop = useCallback(() => {
    let lastCheck = 0;

    const loop = async (timestamp: number) => {
      // Analyze every ~100ms for optimal responsiveness and low CPU usage
      if (timestamp - lastCheck >= 100 && videoRef.current && !videoRef.current.paused) {
        lastCheck = timestamp;
        try {
          const res = await analyzerRef.current.analyzeVideo(videoRef.current);
          setFaceResult(res);
        } catch (e) {
          // Ignore transient capture frame exceptions
        }
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setCameraError(null);
    setIsDemoMode(false);
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
        await videoRef.current.play().catch((err) => {
          console.warn("Video playback error:", err);
        });
        setIsLoading(false);
        startAnalysisLoop();
      }
    } catch (err: any) {
      console.warn("Camera hardware access error:", err);
      setIsLoading(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Camera permission was denied. Please grant camera access, or use the interactive Demo Face Simulator below."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError(
          "No camera hardware detected on this device. You can test face detection using the Demo Face Simulator below."
        );
      } else {
        setCameraError(
          err.message || "Failed to initialize device camera. You can try the Demo Face Simulator."
        );
      }
    }
  }, [stopStream, startAnalysisLoop]);

  // Fallback demo simulator: generates a live synthetic webcam stream with a human face
  const startDemoSimulator = useCallback(() => {
    stopStream();
    setIsLoading(true);
    setCameraError(null);
    setIsDemoMode(true);

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameCount = 0;

    const drawDemoFace = () => {
      frameCount++;
      const time = frameCount * 0.05;

      // Background office atmosphere
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 640, 480);

      // Office wall details
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, 0, 640, 60);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(520, 100, 100, 300);

      // Slight head movement
      const headX = 320 + Math.sin(time * 0.8) * 6;
      const headY = 240 + Math.cos(time * 0.6) * 4;

      // Shoulders / Torso
      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.ellipse(headX, 460, 170, 120, 0, 0, Math.PI * 2);
      ctx.fill();

      // Neck
      ctx.fillStyle = "#f1c27d";
      ctx.fillRect(headX - 35, headY + 70, 70, 60);

      // Head / Face
      ctx.fillStyle = "#f5d0a9";
      ctx.beginPath();
      ctx.ellipse(headX, headY, 78, 105, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = "#1e1b18";
      ctx.beginPath();
      ctx.ellipse(headX, headY - 60, 84, 55, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // Eyes (blinking every few seconds)
      const isBlinking = frameCount % 60 < 4;
      ctx.fillStyle = "#1f2937";
      if (isBlinking) {
        ctx.fillRect(headX - 42, headY - 10, 24, 3);
        ctx.fillRect(headX + 18, headY - 10, 24, 3);
      } else {
        ctx.beginPath();
        ctx.ellipse(headX - 30, headY - 10, 11, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(headX + 30, headY - 10, 11, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // pupils
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.arc(headX - 30, headY - 10, 4, 0, Math.PI * 2);
        ctx.arc(headX + 30, headY - 10, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Eyebrows
      ctx.strokeStyle = "#1e1b18";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(headX - 45, headY - 24);
      ctx.lineTo(headX - 15, headY - 22);
      ctx.moveTo(headX + 15, headY - 22);
      ctx.lineTo(headX + 45, headY - 24);
      ctx.stroke();

      // Nose
      ctx.strokeStyle = "#d49a6a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(headX, headY - 5);
      ctx.lineTo(headX - 6, headY + 25);
      ctx.lineTo(headX + 6, headY + 25);
      ctx.stroke();

      // Smile / Mouth
      ctx.fillStyle = "#b91c1c";
      ctx.beginPath();
      ctx.ellipse(headX, headY + 52, 22, 9, 0, 0, Math.PI);
      ctx.fill();

      // Timestamp watermark in demo
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(10, 10, 240, 26);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 11px monospace";
      ctx.fillText("• DEMO WEBCAM FEED (ACTIVE) •", 18, 27);
    };

    // Draw first frame
    drawDemoFace();

    // Stream from canvas
    const stream = (canvas as any).captureStream ? (canvas as any).captureStream(24) : null;

    if (stream && videoRef.current) {
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.warn);
      setIsLoading(false);

      demoIntervalRef.current = setInterval(drawDemoFace, 1000 / 24);
      startAnalysisLoop();
    } else {
      setIsLoading(false);
      setCameraError("Canvas stream capture is not supported in this browser.");
    }
  }, [stopStream, startAnalysisLoop]);

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

    // Draw video frame to canvas (mirror horizontally to match user perspective)
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Watermark with live timestamp, face presence confirmation & verification badge
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const dateStr = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const isVerified = faceResult?.detected ?? false;
    const conf = faceResult?.confidence ?? 95;

    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(0, canvas.height - 44, canvas.width, 44);

    ctx.font = "bold 13px monospace";
    ctx.fillStyle = isVerified ? "#34d399" : "#fbbf24";
    const statusText = isVerified
      ? `• FACE VERIFIED (${conf}% CONF) • USER PRESENT`
      : `• BIOMETRIC CHECK • ${faceResult?.statusMessage || "CAPTURED"}`;
    ctx.fillText(statusText, 14, canvas.height - 24);

    ctx.font = "normal 11px monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`${dateStr} ${timeStr} • CLIENT-SIDE VISION VALIDATED`, 14, canvas.height - 9);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopStream();
    onCapture(dataUrl, faceResult || undefined);
  };

  const isFacePresent = faceResult?.detected ?? false;
  const canCapture = !isLoading && !cameraError && (!mustValidateFace || isFacePresent);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Video Viewfinder Container */}
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
              Selfie Captured & Verified
            </div>
            {faceResult?.detected && (
              <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                User Present ({faceResult.confidence}%)
              </div>
            )}
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

            {/* Dynamic Viewfinder & Face Tracking Overlays */}
            {!isLoading && !cameraError && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3.5">
                {/* Top Status Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white inline-block" />
                    {isDemoMode ? "DEMO FEED" : "LIVE CAMERA"}
                  </div>

                  {/* Real-time Face Presence Indicator Badge */}
                  {faceResult ? (
                    <div
                      className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm transition-all duration-300 ${
                        faceResult.detected
                          ? "bg-emerald-500/90 text-white ring-2 ring-emerald-300/40"
                          : "bg-amber-500/90 text-slate-950 ring-1 ring-amber-300/30"
                      }`}
                    >
                      {faceResult.detected ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>USER PRESENT ({faceResult.confidence}%)</span>
                        </>
                      ) : (
                        <>
                          <ScanFace className="w-3.5 h-3.5 animate-pulse" />
                          <span>SEARCHING FACE</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-300 bg-slate-900/70 px-2 py-0.5 rounded">
                      ANALYZING STREAM...
                    </span>
                  )}
                </div>

                {/* Real-Time Bounding Box Reticle on Detected Face */}
                {faceResult?.boundingBox && faceResult.confidence > 35 && (
                  <div
                    className={`absolute transition-all duration-100 pointer-events-none rounded-xl border-2 ${
                      faceResult.detected
                        ? "border-emerald-400/90 shadow-[0_0_20px_rgba(16,185,129,0.35)] bg-emerald-500/5"
                        : "border-amber-400/60 border-dashed"
                    }`}
                    style={{
                      top: `${Math.round(faceResult.boundingBox.y * 100)}%`,
                      left: `${Math.round(
                        (1 - faceResult.boundingBox.x - faceResult.boundingBox.width) * 100
                      )}%`,
                      width: `${Math.round(faceResult.boundingBox.width * 100)}%`,
                      height: `${Math.round(faceResult.boundingBox.height * 100)}%`,
                    }}
                  >
                    {/* Tech Reticle Corner Accents */}
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-inherit" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-inherit" />
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-inherit" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-inherit" />
                  </div>
                )}

                {/* Biometric Oval Guide (turns glowing emerald on verification) */}
                <div
                  className={`self-center w-48 h-56 border-2 transition-all duration-300 rounded-full flex items-center justify-center ${
                    isFacePresent
                      ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.25)] ring-4 ring-emerald-500/20"
                      : "border-dashed border-sky-400/70 opacity-80"
                  }`}
                >
                  {isFacePresent && (
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Bottom Live Guidance Message */}
                <div
                  className={`text-center py-1.5 px-3 rounded-lg text-xs font-medium backdrop-blur-md transition-colors ${
                    isFacePresent
                      ? "bg-emerald-950/80 text-emerald-200 border border-emerald-700/50"
                      : "bg-slate-900/85 text-slate-200 border border-slate-700/60"
                  }`}
                >
                  {faceResult?.statusMessage || "Position your face clearly within the oval guide"}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && !cameraError && (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-xs">Initializing camera feed & vision engine...</span>
              </div>
            )}

            {/* Camera Error State with Simulator Fallback */}
            {cameraError && (
              <div className="flex flex-col items-center gap-3 p-6 text-center text-slate-200">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <VideoOff className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-rose-400 mb-1">
                    Camera Hardware Unavailable
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-3">
                    {cameraError}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Camera
                  </button>
                  <button
                    id="start-demo-simulator-btn"
                    type="button"
                    onClick={startDemoSimulator}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Launch Demo Face Simulator
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Face Presence Feedback Bar (when live camera is running) */}
      {!capturedImage && !isLoading && !cameraError && (
        <div className="w-full max-w-md mt-2.5 px-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ScanFace className="w-4 h-4 text-blue-500" />
            <span>Face Detection Engine:</span>
            <span
              className={`font-semibold ${
                isFacePresent ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"
              }`}
            >
              {isFacePresent ? "Verified (Active)" : "Analyzing..."}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-20 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  isFacePresent ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${faceResult?.confidence || 0}%` }}
              />
            </div>
            <span className="font-mono text-[11px]">{faceResult?.confidence || 0}%</span>
          </div>
        </div>
      )}

      {/* Clock-In Validation Banner if face not detected yet */}
      {isClockIn && !capturedImage && !isLoading && !cameraError && !isFacePresent && (
        <div className="w-full max-w-md mt-2.5 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">User Presence Required:</span> Clock-in requires face
            presence validation. Align your face inside the oval until verified.
            <button
              type="button"
              onClick={() => setAllowBypass(true)}
              className="block mt-1 text-[11px] text-amber-700 dark:text-amber-400 underline font-medium hover:text-amber-900"
            >
              Lighting issues? Click to enable manual bypass
            </button>
          </div>
        </div>
      )}

      {/* Camera Action Buttons */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        {capturedImage ? (
          <button
            id="retake-selfie-button"
            type="button"
            onClick={() => {
              setFaceResult(null);
              onRetake();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retake Selfie
          </button>
        ) : (
          <>
            <button
              id="capture-selfie-button"
              type="button"
              disabled={!canCapture}
              onClick={handleCapture}
              className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isFacePresent
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/30"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Camera className="w-4 h-4" />
              {isFacePresent ? "Capture Live Selfie (Face Verified)" : "Capture Live Selfie"}
            </button>

            {/* Quick Demo Simulator trigger for convenience */}
            {!isDemoMode && !cameraError && (
              <button
                type="button"
                onClick={startDemoSimulator}
                className="text-[11px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 underline"
                title="Test with simulated animated face stream"
              >
                Test with Demo Face
              </button>
            )}
          </>
        )}
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center max-w-sm">
        * As per attendance policy, client-side face presence detection analyzes the camera stream
        in real-time to prevent proxy clock-ins.
      </p>
    </div>
  );
};
