'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    verificationCode: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const validateName = (name: string): string => {
    if (!name.trim()) {
      return 'Full name is required';
    }
    if (/\d/.test(name)) {
      return 'Name cannot contain numbers';
    }
    if (!/^[a-zA-Záéíóúàâêôãõç\s]+$/.test(name)) {
      return 'Name must contain only letters and spaces';
    }
    if (name.trim().split(/\s+/).length < 2) {
      return 'Enter your full name (minimum 2 names)';
    }
    return '';
  };

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

  const validateVerificationCode = (code: string): string => {
    if (!code.trim()) {
      return 'Verification code is required';
    }
    if (!/^\d{6}$/.test(code)) {
      return 'Code must be 6 digits';
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

  const validateConfirmPassword = (password: string, confirmPassword: string): string => {
    if (!confirmPassword) {
      return 'Password confirmation is required';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleClose = () => {
    setFormData({ fullName: '', email: '', verificationCode: '', password: '', confirmPassword: '' });
    setErrors({});
    setSuccess(false);
    setCodeSent(false);
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

  const handleSendCode = async () => {
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    setSendingCode(true);
    try {
      // TODO: Integrate with your email verification API
      console.log('Sending verification code to:', formData.email);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCodeSent(true);
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Failed to send code',
      });
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const newErrors: Record<string, string> = {};

    const nameError = validateName(formData.fullName);
    const emailError = validateEmail(formData.email);
    const codeError = validateVerificationCode(formData.verificationCode);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(
      formData.password,
      formData.confirmPassword
    );

    if (nameError) newErrors.fullName = nameError;
    if (emailError) newErrors.email = emailError;
    if (codeError) newErrors.verificationCode = codeError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      console.log('Signup attempt:', formData);
      setSuccess(true);
      setFormData({ fullName: '', email: '', verificationCode: '', password: '', confirmPassword: '' });
      setErrors({});

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Registration failed',
      });
    } finally {
      setLoading(false);
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
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex-1 text-center">Create Account</h2>
          <div className="w-8" />
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          {success ? (
            <div className="text-center space-y-3">
              <div className="text-green-600 font-semibold">
                ✓ Account created successfully!
              </div>
              <p className="text-sm text-gray-600">
                Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-2 text-gray-700">
                  Full Name:
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Smith"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-black placeholder-gray-400 ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

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

              {/* Verification Code */}
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium mb-2 text-gray-700">
                  Verification Code:
                </label>
                <div className="flex gap-2">
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    value={formData.verificationCode}
                    onChange={handleChange}
                    placeholder="6-digit code"
                    maxLength={6}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-black placeholder-gray-400 ${
                      errors.verificationCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <Button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode || !formData.email}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black text-sm px-4 whitespace-nowrap"
                  >
                    {sendingCode ? 'Sending...' : codeSent ? 'Resend' : 'Send Code'}
                  </Button>
                </div>
                {codeSent && !errors.verificationCode && (
                  <p className="text-green-600 text-xs mt-1">Code sent to your email!</p>
                )}
                {errors.verificationCode && (
                  <p className="text-red-600 text-xs mt-1">{errors.verificationCode}</p>
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

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-700">
                  Confirm Password:
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-black placeholder-gray-400 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
