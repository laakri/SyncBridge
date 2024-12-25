import { BrowserQRCodeReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { qrService } from "../services/qrService";
import { Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";

interface QRScannerProps {
  onClose: () => void;
}

export function QRScanner({ onClose }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string>("");
  const [lastResult, setLastResult] = useState<string>("");
  const codeReader = useRef<BrowserQRCodeReader>();
  const controlsRef = useRef<{ stop: () => void }>();
  const navigate = useNavigate();

  useEffect(() => {
    codeReader.current = new BrowserQRCodeReader();

    // Request camera permissions first
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          const videoInputs = devices.filter(
            (device) => device.kind === "videoinput"
          );
          setVideoDevices(videoInputs);
          if (videoInputs.length > 0) {
            setSelectedDevice(videoInputs[0].deviceId);
          }
        });
      })
      .catch((err) => {
        console.error("Camera permission error:", err);
        setError("Camera access denied. Please grant permission and try again.");
      });

    // Cleanup function
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
      setScanning(false);
    };
  }, []);

  useEffect(() => {
    if (selectedDevice && !scanning) {
      startScanning();
    }
  }, [selectedDevice]);

  const startScanning = async () => {
    if (!selectedDevice || !codeReader.current) return;

    // Basic configuration - sometimes less is more
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    
    codeReader.current = new BrowserQRCodeReader(hints, {
      delayBetweenScanAttempts: 100  // Slower scanning for better accuracy
    });

    // Stop any existing scanning session
    if (controlsRef.current) {
      controlsRef.current.stop();
    }

    setScanning(true);
    setError("");

    try {
      const controls = await codeReader.current.decodeFromVideoDevice(
        selectedDevice,
        "qr-video",
        async (result, err) => {
          if (err) {
            if (!(err instanceof NotFoundException)) {
              console.error("Scanning error details:", {
                name: err.name,
                message: err.message,
                stack: err.stack
              });
            }
            return;
          }

          if (result) {
            const url = result.getText();
            console.log("QR Code detected:", url);
            setLastResult(url);

            // Add delay to prevent multiple scans
            if (controlsRef.current) {
              controlsRef.current.stop();
            }
            setScanning(false);

            const qrId = url.split("/").pop();
            if (!qrId) {
              toast.error("Invalid QR code");
              return;
            }

            try {
              // Get IP address
              const ipResponse = await fetch("https://api.ipify.org?format=json");
              const ipData = await ipResponse.json();

              const response = await qrService.authenticateQR(qrId, {
                name: `Web Browser - ${navigator.userAgent}`,
                userAgent: navigator.userAgent,
                ipAddress: ipData.ip,
              });

              // Store authentication data
              localStorage.setItem("access_token", response.access_token);
              localStorage.setItem("refresh_token", response.refresh_token);
              localStorage.setItem("current_device_id", response.device_id);
              localStorage.setItem("user", JSON.stringify(response.user));

              toast.success("Login successful!");
              navigate({ to: "/" });
            } catch (error: any) {
              console.error("Authentication error:", error);
              toast.error(error.message || "Failed to authenticate");
              // Restart scanning if authentication fails
              startScanning();
            }
          }
        }
      );

      controlsRef.current = controls;
    } catch (error) {
      console.error("Camera error details:", error);
      setError("Failed to start camera. Please try again.");
      setScanning(false);
    }
  };

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (controlsRef.current) {
      controlsRef.current.stop();
    }
    setSelectedDevice(e.target.value);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-semibold">Scan QR Code to Login</h2>

      {error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <>
          {videoDevices.length > 1 && (
            <select
              value={selectedDevice}
              onChange={handleDeviceChange}
              className="w-full p-2 rounded bg-background border border-border"
            >
              {videoDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId}`}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full aspect-square max-w-[500px] bg-black rounded-lg overflow-hidden">
            {scanning ? (
              <video
                id="qr-video"
                className="w-full h-full"
                style={{
                  minHeight: "300px",
                  background: "red",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                }}
              ></video>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}

            {/* Scanning overlay */}
            <div className="absolute inset-0 border-2 border-primary/50">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 border-2 border-primary animate-pulse"></div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Scan the QR code from your other device to login
          </p>
        </>
      )}

      {/* Scanning status */}
      <div className="text-sm text-muted-foreground">
        Status: {scanning ? "Scanning..." : "Initializing..."}
      </div>

      <button onClick={onClose}>Close</button>
    </div>
  );
}
