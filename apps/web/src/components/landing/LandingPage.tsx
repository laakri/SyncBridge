import { motion } from "framer-motion";
import { Smartphone, Laptop, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // navigate({ to: "/auth" });
  };

  return (
    <div className="h-[calc(100vh-6rem)] bg-gradient-to-b from-background to-background-secondary">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            Seamless Sync Across
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}
              All Devices
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto"
          >
            Copy on your computer, paste on your phone. Share tasks and media
            instantly between devices.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-primary hover:bg-primary-hover rounded-full flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </button>
            <button className="px-8 py-4 border border-primary/30 hover:border-primary rounded-full transition-all transform hover:scale-105">
              Watch Demo
            </button>
          </motion.div>

          {/* Device Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-20 relative"
          >
            <div className="flex items-center justify-center gap-8">
              <div className="relative">
                <Laptop className="h-48 w-48 text-primary/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-20 bg-primary/10 rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="relative">
                <Smartphone className="h-48 w-48 text-accent/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-24 bg-accent/10 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>

            {/* Connection Line */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-1 bg-gradient-to-r from-primary to-accent rounded-full" />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
