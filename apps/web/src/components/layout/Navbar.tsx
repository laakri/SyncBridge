import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import { SearchBar } from "./SearchBar";
import { useAuth } from "../../contexts/AuthContext";
import {
  Settings,
  LogOut,
  User,
  Activity,
  Zap,
  Laptop,
  QrCode,
} from "lucide-react";
import { useState } from "react";
import { QRScanner } from "../QRScanner";

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-6rem w-full z-50 px-6 py-4 relative"
    >
      <div className="mx-auto container px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex">
            <motion.div
              className="flex flex-shrink-0 items-center cursor-pointer"
              onClick={() => navigate({ to: "/" })}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SyncBridge
              </span>
            </motion.div>
          </div>

          <SearchBar />

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/devices"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 rounded-lg"
                >
                  <Laptop className="w-4 h-4" />
                  Devices
                </Link>
                {/* User Status Indicator */}
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.7, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="text-sm text-gray-400">Active</span>
                </motion.div>

                {/* User Menu Trigger */}
                <motion.div
                  className="relative"
                  onHoverStart={() => setShowMenu(true)}
                  onHoverEnd={() => setShowMenu(false)}
                >
                  <motion.button
                    className="p-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <User className="w-5 h-5 text-primary" />
                  </motion.button>

                  {/* Floating Menu */}
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 rounded-xl bg-background/80 backdrop-blur-lg border border-primary/10 shadow-lg shadow-primary/5"
                      >
                        <div className="p-3">
                          <div className="text-sm font-medium text-gray-300">
                            {user?.username || "User"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {user?.email}
                          </div>
                        </div>

                        <div className="border-t border-primary/10">
                          {menuItems.map((item, index) => (
                            <motion.button
                              key={index}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-primary/5 transition-colors"
                              whileHover={{ x: 5 }}
                              onClick={() => navigate({ to: item.path })}
                            >
                              <item.icon className="w-4 h-4" />
                              {item.label}
                            </motion.button>
                          ))}
                        </div>

                        <motion.button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/5 transition-colors border-t border-primary/10"
                          whileHover={{ x: 5 }}
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  className="flex items-center gap-2 bg-background/50 rounded-full p-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <motion.button
                    onClick={() => setShowScanModal(true)}
                    className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Scan QR Code"
                  >
                    <QrCode className="w-4 h-4 text-primary" />
                  </motion.button>
                  <motion.button
                    className="p-2 rounded-full hover:bg-accent/10 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Zap className="w-4 h-4 text-accent" />
                  </motion.button>
                </motion.div>

                {/* Scan Modal */}
                {showScanModal && (
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
                        onClick={() => setShowScanModal(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                      <QRScanner />
                    </motion.div>
                  </motion.div>
                )}
              </>
            ) : (
              <>
                <motion.button
                  onClick={() => setShowScanModal(true)}
                  className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Scan QR Code"
                >
                  <QrCode className="w-4 h-4 text-primary" />
                </motion.button>
                <motion.button
                  onClick={() => navigate({ to: "/auth" })}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-white font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </motion.button>
                {/* Scan Modal */}
                {showScanModal && (
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
                        onClick={() => setShowScanModal(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                      <QRScanner />
                    </motion.div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

const menuItems = [
  { label: "Activity", icon: Activity, path: "/activity" },
  { label: "Settings", icon: Settings, path: "/settings" },
];
