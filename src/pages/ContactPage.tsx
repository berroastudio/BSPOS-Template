import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { motion } from 'motion/react';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Extraer el token inyectado por Turnstile
    const formElement = e.target as HTMLFormElement;
    const formDataObj = new FormData(formElement);
    const turnstileToken = formDataObj.get('cf-turnstile-response');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, turnstileToken })
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="contact-header"
        >
          <h1>Ponte en Contacto</h1>
          <p>¿Tienes preguntas? Nos encantaría escucharte. Envíanos un mensaje y te responderemos lo antes posible.</p>
        </motion.div>

        <div className="contact-content">
          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="contact-info"
          >
            {/* Teléfono */}
            <div className="info-card">
              <div className="info-icon">
                <Phone size={24} />
              </div>
              <h3>Teléfono</h3>
              <p>
                <a href="tel:+17325233816">+1 (732) 523-3816</a>
              </p>
              <em>Lun-Vie: 9AM-6PM EST</em>
            </div>

            {/* Emails */}
            <div className="info-card">
              <div className="info-icon">
                <Mail size={24} />
              </div>
              <h3>Ventas y Órdenes</h3>
              <p>
                <a href="mailto:sales@berroastudio.com">sales@berroastudio.com</a><br />
                <a href="mailto:ventas@berroastudio.com">ventas@berroastudio.com</a>
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <Mail size={24} />
              </div>
              <h3>Soporte Técnico</h3>
              <p>
                <a href="mailto:support@berroastudio.com">support@berroastudio.com</a><br />
                <a href="mailto:soporte@berroastudio.com">soporte@berroastudio.com</a>
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <Mail size={24} />
              </div>
              <h3>Piezas Custom & Cotizaciones</h3>
              <p>
                <a href="mailto:custom@berroastudio.com">custom@berroastudio.com</a>
              </p>
              <em>Diseños personalizados y piezas únicas</em>
            </div>

            {/* Social / Chat */}
            <div className="info-card social-card highlight">
              <div className="info-icon telegram">
                <Send size={24} />
              </div>
              <h3>Telegram Bot</h3>
              <p>
                <a href="https://t.me/Berroastudio_bot" target="_blank" rel="noopener noreferrer">@Berroastudio_bot</a>
              </p>
              <div className="qr-container">
                <img src="/telegram-qr.jpg" alt="Telegram QR" className="qr-image" />
              </div>
              <em>Chatea con nuestro asistente inteligente</em>
            </div>

            <div className="info-card social-card">
              <div className="info-icon whatsapp">
                <MapPin size={24} /> {/* Placeholder for WhatsApp icon if MessageCircle not imported */}
              </div>
              <h3>WhatsApp Business</h3>
              <p>
                <a href="https://wa.me/17325233816" target="_blank" rel="noopener noreferrer">Chat via WhatsApp</a>
              </p>
              <em>Atención rápida y personalizada</em>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="contact-form-wrapper"
          >
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Nombre Completo</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Asunto</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="¿Cómo podemos ayudarte?"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Mensaje</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Cuéntanos más sobre tu pregunta o comentario..."
                  required
                  rows={5}
                  className="form-input"
                />
              </div>

              {/* Cloudflare Turnstile Invisible Widget */}
              <div 
                className="cf-turnstile" 
                data-sitekey="0x4AAAAAAC15jMWuWb8r3Bcg"
                data-action="contact_form"
                style={{ marginBottom: '1rem' }}
              ></div>

              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="alert alert-success"
                >
                  ✅ Mensaje enviado exitosamente. Nos pondremos en contacto pronto.
                </motion.div>
              )}

              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="alert alert-error"
                >
                  ❌ Hubo un error al enviar el mensaje. Por favor intenta de nuevo.
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-submit"
              >
                <Send size={16} />
                {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
