import { BrowserQRCodeReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { qrService } from "../services/qrService";
import { Loader2 } from "lucide-react";

export function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string>("");
  const codeReader = useRef<BrowserQRCodeReader>();
  const controlsRef = useRef<{ stop: () => void }>();

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
        setError(
          "Camera access denied. Please grant permission and try again."
        );
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
          // Ignore NotFoundException as it's expected when no QR code is in view
          if (err && !(err instanceof NotFoundException)) {
            console.error("Unexpected scanning error:", err);
            return;
          }

          if (result) {
            // Extract qrId from the URL
            const url = result.getText();
            const qrId = url.split("/").pop();

            if (!qrId) {
              toast.error("Invalid QR code");
              return;
            }

            try {
              await qrService.authenticateQR(qrId, {
                name: `Web Browser - ${navigator.userAgent}`,
              });
              toast.success("Device paired successfully!");
              setScanning(false);
              // Stop the camera
              if (controlsRef.current) {
                controlsRef.current.stop();
              }
            } catch (error) {
              toast.error("Failed to authenticate device");
            }
          }
        }
      );

      // Store the controls for cleanup
      controlsRef.current = controls;
    } catch (error) {
      console.error("Failed to start camera:", error);
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
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold">Scan QR Code</h2>

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

          <div className="relative w-full aspect-square max-w-[300px] bg-black rounded-lg overflow-hidden">
            {scanning ? (
              <video
                id="qr-video"
                className="w-full h-full object-cover"
              ></video>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}

            {/* Scanning overlay */}
            <div className="absolute inset-0 border-2 border-primary/50">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 border-2 border-primary animate-pulse"></div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Position the QR code within the frame to scan
          </p>
        </>
      )}
    </div>
  );
}
