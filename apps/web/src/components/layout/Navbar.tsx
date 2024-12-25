import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import { SearchBar } from "./SearchBar";
import { useAuth } from "../../contexts/AuthContext";
import {
  User,
  QrCode,
  Menu,
  X,
  Search,
  ArrowRight,
  Activity,
  Settings,
  LogOut,
  Laptop,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { QRScanner } from "../QRScanner";
import { QRGenerator } from "../QRGenerator";
import logo from "../../assets/mainlogo.png";

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/[0.08]"
      >
        <div className="mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex-shrink-0 cursor-pointer flex items-center gap-2"
              onClick={() => navigate({ to: "/" })}
              whileHover={{ scale: 1.05 }}
            >
              <img src={logo} alt="SyncBridge Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-white">SyncBridge</span>
            </motion.div>

            {/* Desktop Navigation - Hidden on Mobile */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-3">
                {/* Sync Interface Button */}
                <Link
                  to="/sync"
                  className="group relative px-4 py-2 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 border border-white/20 transition-all duration-300"
                >
                  <div className="absolute inset-0 rounded-xl bg-primary/5 blur-sm group-hover:blur-md transition-all" />
                  <div className="relative flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary-light" />
                    <span className="text-sm font-medium bg-gradient-to-r from-primary-light to-accent bg-clip-text text-white">
                      Sync Interface
                    </span>
                  </div>
                </Link>

                {/* Devices Button */}
                <Link
                  to="/devices"
                  className="group relative px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-all duration-300"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      <Laptop className="w-4 h-4 text-white/70" />
                      <Smartphone className="w-4 h-4 text-white/70" />
                    </div>
                    <span className="text-sm font-medium text-white/70 group-hover:text-white/90">
                      Devices
                    </span>
                  </div>
                </Link>

                {/* Search Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSearch(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-all"
                >
                  <Search className="w-4 h-4 text-white/70" />
                  <span className="hidden sm:inline text-sm text-white/70">Search</span>
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/[0.08] bg-white/[0.02] px-1.5 font-mono text-[10px] font-medium text-white/50">
                    ⌘K
                  </kbd>
                </motion.button>
              </div>
            )}

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Not logged in - Show Get Started and QR Scanner */}
              {!isAuthenticated && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate({ to: "/auth" })}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-all"
                  >
                    <span className="text-sm font-medium">Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowScanner(true)}
                    className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-all"
                    title="Scan QR to Login"
                  >
                    <QrCode className="w-4 h-4 text-accent/90" />
                  </motion.button>
                </>
              )}

              {/* Logged in - Show QR Generator and Menu */}
              {isAuthenticated && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowGenerator(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-all"
                  >
                    <QrCode className="w-4 h-4 text-primary/90" />
                    <span className="text-sm text-white/70">Generate QR</span>
                  </motion.button>

                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-all"
                    >
                      <User className="w-4 h-4 text-white/70" />
                    </motion.button>

                    {/* User Menu Dropdown */}
                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 w-48 rounded-xl bg-background-secondary border border-white/[0.08] shadow-lg py-1"
                        >
                          <div className="px-4 py-2 border-b border-white/[0.08]">
                            <p className="text-sm text-white/90">{user?.email}</p>
                          </div>
                          
                          <Link
                            to="/sync"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white/90 hover:bg-white/[0.06]"
                          >
                            <Activity className="w-4 h-4" />
                            Activity
                          </Link>
                          
                          <Link
                            className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white/90 hover:bg-white/[0.06]"
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </Link>
                          
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white/90 hover:bg-white/[0.06]"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-lg hover:bg-white/[0.06]"
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5 text-white/70" />
                ) : (
                  <Menu className="w-5 h-5 text-white/70" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden"
              >
                <div className="px-2 pt-2 pb-3 space-y-1 border-t border-white/[0.08]">
                  {isAuthenticated ? (
                    <>
                      {/* Sync Interface Mobile */}
                      <Link
                        to="/sync"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white/90 hover:bg-white/[0.06]"
                      >
                        <Activity className="w-4 h-4" />
                        Sync Interface
                      </Link>

                      {/* Devices Mobile */}
                      <Link
                        to="/devices"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white/90 hover:bg-white/[0.06]"
                      >
                        <div className="flex -space-x-1">
                          <Laptop className="w-4 h-4" />
                          <Smartphone className="w-4 h-4" />
                        </div>
                        Devices
                      </Link>

                      {/* Settings Mobile */}
                      <Link
                        to="/"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white/90 hover:bg-white/[0.06]"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>

                      {/* Logout Mobile */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white/90 hover:bg-white/[0.06]"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Get Started Mobile */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate({ to: "/auth" })}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-all"
                      >
                        <span className="text-sm font-medium">Get Started</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>

                      {/* Scan QR Mobile */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowScanner(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white/90 hover:bg-white/[0.06]"
                      >
                        <QrCode className="w-4 h-4" />
                        Scan QR to Login
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Modals */}
      <AnimatePresence>
        {showScanner && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          >
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <QRScanner onClose={() => setShowScanner(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGenerator && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          >
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <div className="relative bg-background-secondary rounded-xl shadow-xl">
                <button
                  onClick={() => setShowGenerator(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/[0.06]"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
                <QRGenerator />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && isAuthenticated && (
          <SearchBar onClose={() => setShowSearch(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
