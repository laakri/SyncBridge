import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, useRef } from "react";
import { qrService } from "../services/qrService";
import { Loader2, RefreshCw } from "lucide-react";

export function QRGenerator() {
  const [qrData, setQrData] = useState<{ qrId: string; qrCode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const regenerateTimeoutRef = useRef<NodeJS.Timeout>();
  const expiryTimeoutRef = useRef<NodeJS.Timeout>();
  const timerIntervalRef = useRef<NodeJS.Timer>();

  const generateQR = async () => {
    try {
      setLoading(true);
      setIsExpired(false);
      setError(undefined);
      setTimeLeft(300); // Reset timer to 5 minutes

      const data = await qrService.generateQR();
      setQrData(data);

      // Clear any existing timeouts and intervals
      if (regenerateTimeoutRef.current)
        clearTimeout(regenerateTimeoutRef.current);
      if (expiryTimeoutRef.current) clearTimeout(expiryTimeoutRef.current);
      if (timerIntervalRef.current) {
        // Cast Timer to number to satisfy clearInterval type
        clearInterval(Number(timerIntervalRef.current));
      }

      // Set QR code as expired after 5 minutes
      expiryTimeoutRef.current = setTimeout(
        () => {
          setIsExpired(true);
        },
        5 * 60 * 1000
      );

      // Start countdown timer
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(Number(timerIntervalRef.current));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to generate QR:", error);
      setError("Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  // Format seconds into MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    generateQR();

    return () => {
      // Cleanup timeouts and intervals on unmount
      if (regenerateTimeoutRef.current)
        clearTimeout(regenerateTimeoutRef.current);
      if (expiryTimeoutRef.current) clearTimeout(expiryTimeoutRef.current);
      if (timerIntervalRef.current)
        clearInterval(Number(timerIntervalRef.current));
    };
  }, []); // Empty dependency array - only run on mount

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Scan to Login</h2>

      {loading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Generating QR code...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-500">{error}</p>
          <button
            onClick={generateQR}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : isExpired ? (
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-muted/30 rounded-lg blur-sm">
            {qrData && <QRCodeSVG value={qrData.qrCode} size={200} />}
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">QR code has expired</p>
            <button
              onClick={generateQR}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <RefreshCw className="w-4 h-4" />
              Generate New Code
            </button>
          </div>
        </div>
      ) : qrData ? (
        <div className="flex flex-col items-center gap-2">
          <div className="p-4 bg-white rounded-lg">
            <QRCodeSVG value={qrData.qrCode} size={200} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-muted-foreground">
              Expires in{" "}
              <span className="font-medium">{formatTime(timeLeft)}</span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
