import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/apiClient.js';
import { AttendanceRecord } from '../../types/index.js';
import {
  QrCode,
  Camera,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  RefreshCw,
  X,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (record: AttendanceRecord) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    record?: AttendanceRecord;
    summary?: any;
    errorType?: string;
  } | null>(null);

  // Manual token input state for manual fallback
  const [manualToken, setManualToken] = useState('');
  const [activeSessionToken, setActiveSessionToken] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Fetch active session token for quick 1-click test simulation
  useEffect(() => {
    if (isOpen) {
      api.getSessionQR('active-sess-demo')
        .then((res) => {
          if (res?.token) {
            setActiveSessionToken(res.token);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Handle Geolocation
  useEffect(() => {
    if (isOpen && locationEnabled && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn('Geolocation denied or error:', err.message);
          // Fallback to demo classroom coordinate for test simulations
          setCurrentCoords({ lat: 12.9716, lng: 77.5946 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [isOpen, locationEnabled]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    setScanResult(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this device/browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera failed to start:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. You can allow camera access or use the One-Click Test Scanner below.'
          : 'Could not access camera hardware. Use the instant simulation button below to test seamlessly.'
      );
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScanResult(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Video frame scanning loop using jsQR
  const tickScan = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            // Found a QR code!
            handleProcessScannedQR(code.data);
            return; // pause loop
          }
        }
      }
    }
    if (isOpen) {
      animationFrameRef.current = requestAnimationFrame(tickScan);
    }
  };

  // Play subtle celebratory audio chime via Web Audio API synth
  const playSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  const handleProcessScannedQR = async (qrString: string) => {
    if (isSubmitting || !currentUser) return;
    setIsSubmitting(true);
    stopCamera();

    try {
      const res = await api.scanAttendance({
        qrString: qrString.trim(),
        studentId: currentUser.id,
        latitude: currentCoords?.lat,
        longitude: currentCoords?.lng,
        deviceFingerprint: `Device-${navigator.userAgent.slice(0, 30)}`,
      });

      setScanResult({
        success: true,
        message: res.message,
        record: res.record,
        summary: res.sessionSummary,
      });

      playSuccessSound();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
      });

      if (onSuccess) {
        onSuccess(res.record);
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || 'Attendance verification failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            handleProcessScannedQR(code.data);
          } else {
            setScanResult({
              success: false,
              message: 'No readable QR code found in the uploaded image.',
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Quick 1-click test simulation using active campus session token
  const handleSimulateActiveScan = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.getSessionQR('active-sess-demo');
      if (res?.token) {
        await handleProcessScannedQR(res.token);
      } else {
        setScanResult({
          success: false,
          message: 'No active lecture session is currently broadcasting dynamic QR.',
        });
      }
    } catch (e: any) {
      setScanResult({
        success: false,
        message: e.message || 'No active session available right now',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Scan Dynamic QR Code</h3>
              <p className="text-[11px] text-slate-400">Aim camera at lecture hall screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Result Card: Displayed after scan */}
          {scanResult ? (
            <div
              className={`p-5 rounded-2xl border text-center space-y-3 animate-in zoom-in-95 duration-200 ${
                scanResult.success
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center shadow-lg">
                {scanResult.success ? (
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <XCircle className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-base font-bold text-white">
                  {scanResult.success ? 'Attendance Successfully Recorded!' : 'Verification Denied'}
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                  {scanResult.message}
                </p>
              </div>

              {scanResult.success && scanResult.record && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Student:</span>
                    <span className="font-semibold text-white">{scanResult.record.studentName} ({scanResult.record.studentRollNumber})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Course:</span>
                    <span className="font-semibold text-indigo-400">{scanResult.record.subjectCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Server Timestamp:</span>
                    <span className="font-mono text-slate-200">{new Date(scanResult.record.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verification:</span>
                    <span className="text-emerald-400 font-semibold">{scanResult.record.verificationMethod}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setScanResult(null);
                    startCamera();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Another</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Viewport */
            <div className="space-y-4">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                {/* Hidden canvas for jsQR analysis */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Video element */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />

                {/* Targeting Reticle & Scanning Animation */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Darkened overlay cutout */}
                    <div className="w-56 h-56 relative rounded-2xl border-2 border-indigo-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                      {/* Reticle Corner accents */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />

                      {/* Laser scan line animation */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-cyan-400 via-indigo-400 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-bounce" />
                    </div>
                  </div>
                )}

                {/* Camera error/fallback message */}
                {cameraError && (
                  <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-950/90 z-10">
                    <Camera className="w-10 h-10 text-slate-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-200">{cameraError}</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      No worries! You can use the instant test scan button below to test the full live verification pipeline.
                    </p>
                  </div>
                )}

                {/* Submitting spinner */}
                {isSubmitting && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs font-bold text-white">Cryptographically Validating Token...</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Checking signature, expiration & enrollment</p>
                  </div>
                )}
              </div>

              {/* Classroom Location Protection Toggle */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white block">Classroom Geolocation</span>
                    <span className="text-[10px] text-slate-400">
                      {currentCoords ? 'Location acquired (Turing Hall geofence)' : 'Verifies in-room presence'}
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locationEnabled}
                    onChange={(e) => setLocationEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* 1-Click Test Simulation Button */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-cyan-950/30 to-indigo-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Instant Live Demo Scanner</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Active Session Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Test the real-time attendance recording flow right now with the active lecture (<strong>CS301 in LH-101</strong>) with one click:
                </p>
                <button
                  onClick={handleSimulateActiveScan}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Scan Active QR Token for {currentUser?.name || 'Student'}</span>
                </button>
              </div>

              {/* Upload QR File / Manual Fallback */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                <label className="cursor-pointer text-slate-400 hover:text-white flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-800 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Upload QR Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>20s rotating token</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
