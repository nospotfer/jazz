'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MessageType = 'question' | 'doubt' | 'inquiry' | 'help-request' | '';

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    messageType: '' as MessageType,
    message: '',
    email: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const messageTypes = [
    { value: 'question', label: 'Pregunta' },
    { value: 'doubt', label: 'Duda' },
    { value: 'inquiry', label: 'Consulta' },
    { value: 'help-request', label: 'Solicitud de ayuda' },
  ];

  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return 'El correo es obligatorio';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Formato de correo inválido';
    }
    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.messageType) {
      newErrors.messageType = 'Selecciona un tipo de mensaje';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'El mensaje es obligatorio';
    } else if (formData.message.length > 1000) {
      newErrors.message = 'El mensaje no debe superar los 1000 caracteres';
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setFormData({ messageType: '', message: '', email: '' });
    setErrors({});
    setSuccess(false);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Integrate with your backend API to send the message
      // For now, just simulate the submission
      console.log('Formulario de contacto enviado:', formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(true);
      setFormData({ messageType: '', message: '', email: '' });

      // Close modal after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'No se pudo enviar el mensaje',
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
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex-1 text-center">Contáctanos</h2>
          <div className="w-8" />
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          {success ? (
            <div className="text-center space-y-3">
              <div className="text-green-600 font-semibold">
                ✓ ¡Mensaje enviado correctamente!
              </div>
              <p className="text-sm text-gray-600">
                Te responderemos pronto a {formData.email}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Message Type */}
              <div>
                <label htmlFor="messageType" className="block text-sm font-medium mb-2 text-gray-700">
                  Tipo de mensaje: <span className="text-red-500">*</span>
                </label>
                <select
                  id="messageType"
                  name="messageType"
                  value={formData.messageType}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 ${
                    errors.messageType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona un tipo...</option>
                  {messageTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.messageType && (
                  <p className="text-red-600 text-xs mt-1">{errors.messageType}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-700">
                  Mensaje: <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  maxLength={1000}
                  placeholder="Escribe tu mensaje aquí..."
                  rows={5}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 placeholder-gray-400 resize-none ${
                    errors.message ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-gray-600 text-xs">{formData.message.length}/1000 caracteres</p>
                  {errors.message && (
                    <p className="text-red-600 text-xs">{errors.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">
                  Tu correo: <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@correo.com"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 placeholder-gray-400 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Admin Email Notice */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="text-xs text-gray-600">
                  Tu mensaje se enviará a: <span className="font-semibold text-gray-900">admin@neurofactory.net</span>
                </p>
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
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar mensaje'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
