import { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

interface ContactFormProps {
  tenantId?: string;
  onSuccess?: (contactId: string) => void;
  onError?: (error: string) => void;
}

export default function ContactForm({ tenantId, onSuccess, onError }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El email es requerido');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido');
      return false;
    }
    if (!formData.subject.trim()) {
      setError('El asunto es requerido');
      return false;
    }
    if (!formData.message.trim()) {
      setError('El mensaje es requerido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        tenantId
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar mensaje');
      }

      const data = await response.json();

      setContactId(data.contactId);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });

      if (onSuccess) {
        onSuccess(data.contactId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted && contactId) {
    return (
      <div className="contact-success">
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '16px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <h3 style={{ marginTop: 0 }}>✅ ¡Mensaje enviado exitosamente!</h3>
          <p>Gracias por tu mensaje. Nos pondremos en contacto pronto.</p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            <strong>Referencia:</strong> {contactId}
          </p>
        </div>
        <Button
          onClick={() => {
            setSubmitted(false);
            setContactId(null);
          }}
          variant="secondary"
        >
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <h2>📧 Formulario de Contacto</h2>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          Nombre *
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Tu nombre completo"
          disabled={loading}
          required
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          Email *
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="tu@email.com"
          disabled={loading}
          required
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="phone" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          Teléfono (Opcional)
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+1-809-555-0100"
          disabled={loading}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="subject" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          Asunto *
        </label>
        <Input
          id="subject"
          name="subject"
          type="text"
          value={formData.subject}
          onChange={handleChange}
          placeholder="¿Cuál es tu pregunta?"
          disabled={loading}
          required
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="message" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          Mensaje *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Cuéntanos más sobre tu consulta..."
          disabled={loading}
          required
          style={{
            width: '100%',
            minHeight: '150px',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            resize: 'vertical'
          }}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px'
        }}
      >
        {loading ? '⏳ Enviando...' : '📤 Enviar Mensaje'}
      </Button>
    </form>
  );
}
