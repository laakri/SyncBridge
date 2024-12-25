import { motion} from "framer-motion";
import { 
  Smartphone, Laptop, ArrowRight, Command, 
  Zap, Shield, Globe, Clipboard
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { FlipWords } from "./FlipWords";
import { Footer } from "./Footer";

export function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-gradient-y" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-[128px] animate-gradient-y" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-normal tracking-tight">
              <span className="text-neutral-400">Experience</span>{" "}
              <FlipWords
                words={[
                  "Seamless Sync",
                  "Quick Sharing",
                  "Safe Storage",
                  "Everything"
                ]}
                className="text-primary-light"
              />
              <span className="text-neutral-400"> across devices</span>
            </h1>
            <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
              Share content instantly between your devices. As simple as copy on one device, paste on another.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetStarted}
              className="group px-6 py-3 bg-primary hover:bg-primary-hover border border-primary/20 rounded-xl flex items-center gap-2 transition-all duration-300"
            >
              <Command className="w-4 h-4 text-white/90" />
              <span className="text-white/90">Get Started Free</span>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 border border-border hover:border-border-light rounded-xl flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-all"
            >
              <Zap className="w-4 h-4" />
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Device Preview with softer colors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative mt-12 pt-8"
          >
            <div className="flex items-center justify-center gap-16">
              <motion.div
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                className="relative"
              >
                <div className="p-6 rounded-2xl bg-background-secondary border border-border">
                  <Laptop className="h-24 w-24 text-neutral-600" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-10 bg-primary/5 rounded-lg animate-pulse" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ x: 20 }}
                animate={{ x: 0 }}
                className="relative"
              >
                <div className="p-6 rounded-2xl bg-background-secondary border border-border">
                  <Smartphone className="h-24 w-24 text-neutral-600" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-14 bg-accent/5 rounded-lg animate-pulse" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Connection Line */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full" />
          </motion.div>

          {/* Features Grid with updated colors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12"
          >
            {[
              { icon: Clipboard, title: "Universal Clipboard", desc: "Copy on any device, paste anywhere instantly" },
              { icon: Shield, title: "Secure Sync", desc: "End-to-end encryption for all your data" },
              { icon: Globe, title: "Work Anywhere", desc: "Access your content from any device, anytime" }
            ].map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                whileHover={{ y: -2 }}
                className="bg-background-secondary backdrop-blur-xl border border-border rounded-xl p-4 hover:border-border-light transition-colors"
              >
                <div className="p-2 w-fit rounded-lg bg-primary/10 border border-primary/20 mb-3">
                  <Icon className="w-4 h-4 text-primary-light" />
                </div>
                <h3 className="font-medium text-neutral-300 mb-1">{title}</h3>
                <p className="text-sm text-neutral-400">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <h2 className="text-3xl font-semibold text-white/90">How It Works</h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Experience the magic of seamless content sharing across all your devices
            </p>
          </motion.div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect Devices",
                description: "Securely link your devices with a simple QR code scan"
              },
              {
                step: "02",
                title: "Share Content",
                description: "Copy on one device, instantly available on all others"
              },
              {
                step: "03",
                title: "Stay in Sync",
                description: "Your content stays synchronized across all devices"
              }
            ].map(({ step, title, description }) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 space-y-4">
                  <span className="text-sm font-medium text-primary/60">{step}</span>
                  <h3 className="text-xl font-medium text-white/90">{title}</h3>
                  <p className="text-white/50">{description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 backdrop-blur-3xl" />
        <div className="relative max-w-3xl mx-auto space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <h2 className="text-3xl font-semibold text-white/90">
              Powerful Features
            </h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Everything you need for seamless cross-device content sharing
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Universal Clipboard",
                description: "Copy and paste between devices instantly"
              },
              {
                title: "File Sharing",
                description: "Share files with a single click"
              },
              {
                title: "Reading List",
                description: "Save and sync articles across devices"
              },
              {
                title: "Quick Notes",
                description: "Capture thoughts and access them anywhere"
              }
            ].map(({ title, description }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl p-6"
              >
                <h3 className="text-lg font-medium text-white/90 mb-2">{title}</h3>
                <p className="text-white/50">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center space-y-8"
        >
          <h2 className="text-3xl font-semibold text-white/90">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Join thousands of users who are already experiencing seamless content sharing
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGetStarted}
            className="px-8 py-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl inline-flex items-center gap-2 transition-all duration-300"
          >
            <Command className="w-5 h-5 text-primary/80" />
            <span className="text-primary font-medium">Get Started Free</span>
            <ArrowRight className="w-5 h-5 text-primary/60" />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
