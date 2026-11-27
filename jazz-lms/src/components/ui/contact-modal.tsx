'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { AccessibleDialog } from './accessible-dialog';
import { useLanguage } from '@/components/providers/language-provider';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MessageType = 'question' | 'doubt' | 'inquiry' | 'help-request' | '';
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'admin@neurofactory.net';

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const { language } = useLanguage();
  const copy = {
    es: {
      messageTypes: {
        question: 'Pregunta',
        doubt: 'Duda',
        inquiry: 'Consulta',
        helpRequest: 'Solicitud de ayuda',
      },
      emailRequired: 'El correo es obligatorio',
      invalidEmail: 'Formato de correo inválido',
      selectType: 'Selecciona un tipo de mensaje',
      messageRequired: 'El mensaje es obligatorio',
      messageTooLong: 'El mensaje no debe superar los 1000 caracteres',
      submitError: 'No se pudo enviar el mensaje',
      close: 'Cerrar',
      title: 'Contáctanos',
      sentSuccess: '✓ ¡Mensaje enviado correctamente!',
      sentTo: 'Te responderemos pronto a',
      messageType: 'Tipo de mensaje',
      required: '*',
      selectTypePlaceholder: 'Selecciona un tipo...',
      message: 'Mensaje',
      messagePlaceholder: 'Escribe tu mensaje aquí...',
      characters: 'caracteres',
      email: 'Tu correo',
      emailPlaceholder: 'tu@correo.com',
      adminNotice: 'Tu mensaje se enviará a:',
      cancel: 'Cancelar',
      sending: 'Enviando...',
      send: 'Enviar mensaje',
    },
    en: {
      messageTypes: {
        question: 'Question',
        doubt: 'Doubt',
        inquiry: 'Inquiry',
        helpRequest: 'Help request',
      },
      emailRequired: 'Email is required',
      invalidEmail: 'Invalid email format',
      selectType: 'Select a message type',
      messageRequired: 'Message is required',
      messageTooLong: 'Message must not exceed 1000 characters',
      submitError: 'Unable to send message',
      close: 'Close',
      title: 'Contact us',
      sentSuccess: '✓ Message sent successfully!',
      sentTo: 'We will reply to',
      messageType: 'Message type',
      required: '*',
      selectTypePlaceholder: 'Select a type...',
      message: 'Message',
      messagePlaceholder: 'Write your message here...',
      characters: 'characters',
      email: 'Your email',
      emailPlaceholder: 'you@email.com',
      adminNotice: 'Your message will be sent to:',
      cancel: 'Cancel',
      sending: 'Sending...',
      send: 'Send message',
    },
    fr: {
      messageTypes: {
        question: 'Question',
        doubt: 'Doute',
        inquiry: 'Demande',
        helpRequest: 'Demande d’aide',
      },
      emailRequired: 'L’e-mail est obligatoire',
      invalidEmail: 'Format d’e-mail invalide',
      selectType: 'Sélectionnez un type de message',
      messageRequired: 'Le message est obligatoire',
      messageTooLong: 'Le message ne doit pas dépasser 1000 caractères',
      submitError: 'Impossible d’envoyer le message',
      close: 'Fermer',
      title: 'Contactez-nous',
      sentSuccess: '✓ Message envoyé avec succès !',
      sentTo: 'Nous vous répondrons bientôt à',
      messageType: 'Type de message',
      required: '*',
      selectTypePlaceholder: 'Sélectionnez un type...',
      message: 'Message',
      messagePlaceholder: 'Écrivez votre message ici...',
      characters: 'caractères',
      email: 'Votre e-mail',
      emailPlaceholder: 'vous@email.com',
      adminNotice: 'Votre message sera envoyé à :',
      cancel: 'Annuler',
      sending: 'Envoi...',
      send: 'Envoyer le message',
    },
    pt: {
      messageTypes: {
        question: 'Pergunta',
        doubt: 'Dúvida',
        inquiry: 'Consulta',
        helpRequest: 'Pedido de ajuda',
      },
      emailRequired: 'O e-mail é obrigatório',
      invalidEmail: 'Formato de e-mail inválido',
      selectType: 'Selecione um tipo de mensagem',
      messageRequired: 'A mensagem é obrigatória',
      messageTooLong: 'El mensaje no puede superar 1000 caracteres',
      submitError: 'No fue posible enviar el mensaje',
      close: 'Fechar',
      title: 'Fale conosco',
      sentSuccess: '✓ Mensagem enviada com sucesso!',
      sentTo: 'Responderemos em breve para',
      messageType: 'Tipo de mensagem',
      required: '*',
      selectTypePlaceholder: 'Selecione um tipo...',
      message: 'Mensagem',
      messagePlaceholder: 'Escreva sua mensagem aqui...',
      characters: 'caracteres',
      email: 'Seu e-mail',
      emailPlaceholder: 'voce@email.com',
      adminNotice: 'Sua mensagem será enviada para:',
      cancel: 'Cancelar',
      sending: 'Enviando...',
      send: 'Enviar mensagem',
    },
  }[language];

  const [formData, setFormData] = useState({
    messageType: '' as MessageType,
    message: '',
    email: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const messageTypes = [
    { value: 'question', label: copy.messageTypes.question },
    { value: 'doubt', label: copy.messageTypes.doubt },
    { value: 'inquiry', label: copy.messageTypes.inquiry },
    { value: 'help-request', label: copy.messageTypes.helpRequest },
  ];

  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return copy.emailRequired;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return copy.invalidEmail;
    }
    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.messageType) {
      newErrors.messageType = copy.selectType;
    }

    if (!formData.message.trim()) {
      newErrors.message = copy.messageRequired;
    } else if (formData.message.length > 1000) {
      newErrors.message = copy.messageTooLong;
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
    setSentEmail('');
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
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || copy.submitError);
      }

      setSuccess(true);
      setSentEmail(formData.email);
      setFormData({ messageType: '', message: '', email: '' });

      // Close modal after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : copy.submitError,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AccessibleDialog label={copy.title} onClose={handleClose} className="max-w-md rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <button
            type="button"
            onClick={handleClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md p-1 hover:bg-accent transition"
            aria-label={copy.close}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex-1 text-center">{copy.title}</h2>
          <div className="w-8" />
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          {success ? (
            <div role="status" className="text-center space-y-3">
              <div className="text-green-600 font-semibold">
                {copy.sentSuccess}
              </div>
              <p className="text-sm text-muted-foreground">
                {copy.sentTo} {sentEmail}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Message Type */}
              <div>
                <label htmlFor="messageType" className="block text-sm font-medium mb-2 text-foreground">
                  {copy.messageType}: <span className="text-red-500">{copy.required}</span>
                </label>
                <select
                  id="messageType"
                  name="messageType"
                  value={formData.messageType}
                  onChange={handleChange}
                  className={`w-full min-h-11 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-yellow-500 text-foreground ${
                    errors.messageType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{copy.selectTypePlaceholder}</option>
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
                <label htmlFor="message" className="block text-sm font-medium mb-2 text-foreground">
                  {copy.message}: <span className="text-red-500">{copy.required}</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  maxLength={1000}
                  placeholder={copy.messagePlaceholder}
                  rows={5}
                  className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-yellow-500 text-foreground placeholder:text-muted-foreground resize-none ${
                    errors.message ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-muted-foreground text-xs">{formData.message.length}/1000 {copy.characters}</p>
                  {errors.message && (
                    <p className="text-red-600 text-xs">{errors.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                  {copy.email}: <span className="text-red-500">{copy.required}</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={copy.emailPlaceholder}
                  className={`w-full min-h-11 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-yellow-500 text-foreground placeholder:text-muted-foreground ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Admin Email Notice */}
              <div className="bg-muted border border-border rounded-md p-3">
                <p className="text-xs text-muted-foreground">
                  {copy.adminNotice} <span className="font-semibold text-foreground break-all">{SUPPORT_EMAIL}</span>
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  className="min-h-11 h-auto flex-1 whitespace-normal py-2"
                  disabled={loading}
                >
                  {copy.cancel}
                </Button>
                <Button
                  type="submit"
                  className="min-h-11 h-auto flex-1 whitespace-normal bg-yellow-500 hover:bg-yellow-600 py-2 text-black"
                  disabled={loading}
                >
                  {loading ? copy.sending : copy.send}
                </Button>
              </div>
            </form>
          )}
        </div>
    </AccessibleDialog>
  );
}
