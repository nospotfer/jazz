'use client';

import { X, Github } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gitHubLoading, setGitHubLoading] = useState(false);

  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email (must contain @)';
    }
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must have at least 6 characters';
    }
    return '';
  };

  const handleClose = () => {
    setFormData({ email: '', password: '' });
    setErrors({});
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const newErrors: Record<string, string> = {};

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Aqui você adiciona a chamada para a API de login
      // Por enquanto, apenas mostramos mensagem de sucesso
      console.log('Login attempt:', formData);
      
      // Simular delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      handleClose();
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Login failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setGitHubLoading(true);
    try {
      // Aqui você adiciona a chamada para login via GitHub
      // Por enquanto é apenas um placeholder
      console.log('GitHub login initiated');
      
      // Simular delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      handleClose();
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'GitHub login failed',
      });
    } finally {
      setGitHubLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 sm:p-6 min-h-screen">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm sm:max-w-md my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-md transition"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex-1 text-center">Login</h2>
          <div className="w-8" />
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {errors.submit}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">
                Email:
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-black placeholder-gray-400 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700">
                Password:
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-black placeholder-gray-400 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.password && (
                <p className="text-red-600 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="flex-1"
                disabled={loading || gitHubLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                disabled={loading || gitHubLoading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </div>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            {/* GitHub Login */}
            <Button
              type="button"
              onClick={handleGitHubLogin}
              disabled={loading || gitHubLoading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2"
            >
              <Github className="h-5 w-5" />
              {gitHubLoading ? 'Connecting...' : 'Login with GitHub'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
