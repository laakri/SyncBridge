import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authService } from "../services/authService";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailRoute } from "../routes";

export function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { token } = verifyEmailRoute.useSearch();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          setStatus("error");
          setMessage("Invalid verification link");
          return;
        }

        const { message } = await authService.verifyEmail(token);
        setStatus("success");
        setMessage(message);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate({ to: "/auth" });
        }, 3000);
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Email verification failed");
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background-secondary p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-2xl p-8 shadow-xl border border-border text-center"
      >
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Verifying your email...</h2>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold text-green-500">
              Email Verified!
            </h2>
            <p className="mt-2 text-gray-400">{message}</p>
            <p className="mt-4 text-sm text-gray-500">
              Redirecting to login...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-red-500">
              Verification Failed
            </h2>
            <p className="mt-2 text-gray-400">{message}</p>
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Back to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
