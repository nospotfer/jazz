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
    ssn: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Validate name: only letters and spaces, no numbers
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

  // Validate email with @
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

  // Validate SSN/National ID (XXX-XX-XXXX format)
  const validateSSN = (ssn: string): string => {
    if (!ssn.trim()) {
      return 'SSN/National ID is required';
    }
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(ssn)) {
      return 'Invalid SSN/National ID format (use XXX-XX-XXXX)';
    }
    return '';
  };

  // Validate password
  const validatePassword = (password: string): string => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must have at least 6 characters';
    }
    return '';
  };

  // Validate password confirmation
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
    // Limpar todos os campos ao fechar
    setFormData({ fullName: '', email: '', ssn: '', password: '', confirmPassword: '' });
    setErrors({});
    setSuccess(false);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro do campo quando o usuário começa a digitar
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

    // Validar todos os campos
    const nameError = validateName(formData.fullName);
    const emailError = validateEmail(formData.email);
    const ssnError = validateSSN(formData.ssn);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(
      formData.password,
      formData.confirmPassword
    );

    if (nameError) newErrors.fullName = nameError;
    if (emailError) newErrors.email = emailError;
    if (ssnError) newErrors.ssn = ssnError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Aqui você pode adicionar a chamada para a API de cadastro
      // Por enquanto, apenas mostramos mensagem de sucesso
      setSuccess(true);
      setFormData({ fullName: '', email: '', ssn: '', password: '', confirmPassword: '' });
      setErrors({});

      // Fecha o modal após 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Erro ao cadastrar',
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
            aria-label="Fechar"
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

              {/* Nome Completo */}
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
              {/* SSN/National ID */}
              <div>
                <label htmlFor="ssn" className="block text-sm font-medium mb-2 text-gray-700">
                  SSN/National ID:
                </label>
                <input
                  id="ssn"
                  name="ssn"
                  type="text"
                  value={formData.ssn}
                  onChange={handleChange}
                  placeholder="XXX-XX-XXXX"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-black placeholder-gray-400 ${
                    errors.ssn ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.ssn && (
                  <p className="text-red-600 text-xs mt-1">{errors.ssn}</p>
                )}
              </div>
              {/* Senha */}
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

              {/* Confirmar Senha */}
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

              {/* Botões */}
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
