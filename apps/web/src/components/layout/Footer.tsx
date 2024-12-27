import { motion } from "framer-motion";
import { 
  Github, 
  Twitter, 
  Globe, 
  Heart,
  Shield, 
  Zap,
  Laptop
} from "lucide-react";

export function Footer() {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative border-t border-white/[0.08] bg-black/20 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-primary" />
              <span className="text-lg font-medium text-white/90">SyncShare</span>
            </div>
            <p className="text-sm text-white/50 max-w-xs">
              Seamlessly sync and share content across all your devices with end-to-end encryption.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/90 transition-colors"
              >
                <Github className="w-5 h-5" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/90 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                href="https://website.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/90 transition-colors"
              >
                <Globe className="w-5 h-5" />
              </motion.a>
            </div>
          </div>

          {/* Quick Links */}
          {[
            {
              title: "Product",
              links: ["Features", "Security", "Pricing", "Changelog"]
            },
            {
              title: "Resources",
              links: ["Documentation", "API", "Privacy", "Terms"]
            },
            {
              title: "Company",
              links: ["About", "Blog", "Careers", "Contact"]
            }
          ].map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-medium text-white/90">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <motion.a
                      whileHover={{ x: 2 }}
                      href="#"
                      className="text-sm text-white/50 hover:text-white/90 transition-colors"
                    >
                      {link}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-8 border-t border-white/[0.08]">
          <div className="flex items-center gap-1 text-sm text-white/40">
            Made with <Heart className="w-4 h-4 text-red-400" /> by SyncShare Team
          </div>
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60"
            >
              <Shield className="w-4 h-4" />
              Privacy Policy
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60"
            >
              <Zap className="w-4 h-4" />
              Terms of Service
            </motion.button>
          </div>
        </div>
      </div>
    </motion.footer>
  );
} 