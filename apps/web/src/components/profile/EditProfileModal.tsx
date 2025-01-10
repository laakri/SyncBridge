import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { profileService, UserProfile } from "../../services/profileService";
import { toast } from "react-hot-toast";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onUpdate: () => void;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export function EditProfileModal({ isOpen, onClose, profile, onUpdate }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    full_name: profile?.user?.full_name || '',
    username: profile?.user?.username || '',
    timezone: profile?.user?.timezone || '',
    preferred_language: profile?.user?.preferred_language || 'en'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (!USERNAME_REGEX.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    }

    // Full name validation
    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await profileService.updateProfile(formData);
      toast.success('Profile updated successfully');
      onUpdate();
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update profile';
      toast.error(errorMessage);
      
      // Handle specific validation errors
      if (errorMessage.includes('Username')) {
        setErrors(prev => ({
          ...prev,
          username: errorMessage
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white/90">Edit Profile</h3>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/[0.06] rounded-lg"
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={handleInputChange('full_name')}
                  disabled={isSubmitting}
                  className={`w-full bg-white/[0.03] border ${
                    errors.full_name ? 'border-red-400' : 'border-white/[0.08]'
                  } rounded-xl px-4 py-2 text-white/90`}
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-400">{errors.full_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  disabled={isSubmitting}
                  className={`w-full bg-white/[0.03] border ${
                    errors.username ? 'border-red-400' : 'border-white/[0.08]'
                  } rounded-xl px-4 py-2 text-white/90`}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-400">{errors.username}</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 