import { motion } from "framer-motion";
import { Laptop, Plus } from "lucide-react";
import { useState } from "react";
import { QRLogin } from "../components/QRLogin";

export function DevicesPage() {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Your Devices</h1>
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        </div>

        {/* Devices List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Device */}
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Laptop className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-medium">Current Browser</h3>
                <p className="text-sm text-gray-400">Last active: Just now</p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-card rounded-xl p-6 max-w-md w-full relative"
            >
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                ✕
              </button>
              <QRLogin />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
