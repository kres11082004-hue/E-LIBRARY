import React, { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

interface FaceScannerProps {
  onSuccess: () => void;
}

type VerificationStep = "idle" | "straight" | "blink" | "left" | "right" | "success";

export function FaceScanner({ onSuccess }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [step, setStep] = useState<VerificationStep>("idle");
  const [message, setMessage] = useState("Loading face detection models...");
  const [error, setError] = useState<string | null>(null);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        setModelsLoaded(true);
        setMessage("Please look straight into the camera.");
        setStep("straight");
      } catch (err) {
        console.error("Error loading models", err);
        setError("Failed to load face detection models. Please refresh the page.");
      }
    };
    loadModels();
  }, []);

  // Start video
  useEffect(() => {
    if (!modelsLoaded) return;

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300, facingMode: "user" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
      } catch (err) {
        console.error("Error accessing webcam", err);
        setError("Webcam access denied. Please allow camera permissions to continue.");
      }
    };
    startVideo();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [modelsLoaded]);

  const getEAR = (eye: faceapi.Point[]) => {
    // 0: left outer, 1: left top-outer, 2: left top-inner, 3: left inner, 4: left bottom-inner, 5: left bottom-outer
    const p0 = eye[0], p1 = eye[1], p2 = eye[2], p3 = eye[3], p4 = eye[4], p5 = eye[5];
    const v1 = Math.hypot(p1.x - p5.x, p1.y - p5.y);
    const v2 = Math.hypot(p2.x - p4.x, p2.y - p4.y);
    const h = Math.hypot(p0.x - p3.x, p0.y - p3.y);
    return (v1 + v2) / (2.0 * h);
  };

  const handleVideoPlay = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    let blinkFrames = 0;

    const interval = setInterval(async () => {
      if (step === "success" || step === "idle" || !videoRef.current) return;

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (!detection) {
        setMessage("No face detected. Please ensure your face is fully visible.");
        return;
      }

      // Resize detection for drawing/measurements (optional if we just use relative landmarks)
      // const resizedDetections = faceapi.resizeResults(detection, displaySize);

      const landmarks = detection.landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const noseTip = landmarks.getNose()[3]; // Tip of the nose
      const jawOutline = landmarks.getJawOutline();
      const leftCheek = jawOutline[0]; // from user's perspective, this is their right cheek
      const rightCheek = jawOutline[16];

      const leftEAR = getEAR(leftEye);
      const rightEAR = getEAR(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2.0;

      // Calculate head yaw ratio
      // Since video is usually mirrored by CSS, let's just look at the raw coordinate space
      const dLeft = Math.abs(noseTip.x - leftCheek.x);
      const dRight = Math.abs(rightCheek.x - noseTip.x);
      
      // If dLeft is much larger than dRight, face is turned.
      const yawRatio = dLeft / (dRight || 1);

      setStep((currentStep) => {
        let nextStep = currentStep;

        if (currentStep === "straight") {
          setMessage("Great. Now please BLINK your eyes.");
          if (yawRatio > 0.7 && yawRatio < 1.4) {
            nextStep = "blink";
          }
        } 
        else if (currentStep === "blink") {
          if (avgEAR < 0.23) {
            blinkFrames++;
          } else {
            if (blinkFrames >= 1) {
              // Blink detected
              setMessage("Perfect! Now turn your head slowly to the LEFT.");
              nextStep = "left";
            }
            blinkFrames = 0;
          }
        } 
        else if (currentStep === "left") {
          // Subject turns head to their left.
          // Depending on mirroring, yawRatio will go > 1.8 or < 0.6. Let's accept either strong turn
          if (yawRatio < 0.5) {
            setMessage("Good! Now turn your head slowly to the RIGHT.");
            nextStep = "right";
          }
        } 
        else if (currentStep === "right") {
          if (yawRatio > 2.0) {
            setMessage("Liveness verified!");
            nextStep = "success";
          }
        }

        return nextStep;
      });

    }, 150);

    return () => clearInterval(interval);
  }, [step]);

  // When success is reached, call onSuccess after a short delay
  useEffect(() => {
    if (step === "success") {
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  }, [step, onSuccess]);

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-xl text-center">
        <p className="font-semibold text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative rounded-xl overflow-hidden bg-black/5 aspect-[4/3] w-full max-w-sm flex items-center justify-center border-2 border-border shadow-inner">
        {!modelsLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Initializing Face Scanner...</p>
          </div>
        )}
        
        {step === "success" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/90 text-white z-10 backdrop-blur-sm">
            <CheckCircle2 className="w-16 h-16 mb-2" />
            <p className="text-lg font-bold">Verified</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onPlay={handleVideoPlay}
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      </div>

      <div className="text-center p-3 bg-primary/5 border border-primary/20 rounded-lg w-full max-w-sm transition-colors">
        <p className="font-medium text-primary text-sm sm:text-base animate-pulse">{message}</p>
      </div>
    </div>
  );
}
