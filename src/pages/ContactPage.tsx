import { useState } from 'react';
import { Mail, Phone, MapPin, Send, ShieldCheck, Lock, Globe, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { BerroaQR } from '../components/BerroaQR';

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
          className="contact-header"
        >
          <div className="bo-badge blue mb-2">Soporte Global</div>
          <h1>Canales de Atención</h1>
          <p>Selecciona el canal más conveniente para tu región o necesidad técnica.</p>
        </motion.div>

        <div className="contact-content">
          {/* Info Side */}
          <div className="contact-info">
            
            {/* REGION: RD */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="region-group">
               <div className="region-label"><Globe size={14}/> República Dominicana</div>
               <div className="info-grid">
                  <div className="info-card">
                     <h3>Ventas y Órdenes</h3>
                     <a href="mailto:ventas@berroastudio.com">ventas@berroastudio.com</a>
                  </div>
                  <div className="info-card">
                     <h3>Soporte Técnico</h3>
                     <a href="mailto:soporte@berroastudio.com">soporte@berroastudio.com</a>
                  </div>
               </div>
            </motion.div>

            {/* REGION: USA */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="region-group">
               <div className="region-label"><Globe size={14}/> United States</div>
               <div className="info-grid">
                  <div className="info-card">
                     <h3>Sales & General Inquiries</h3>
                     <a href="mailto:sales@berroastudio.com">sales@berroastudio.com</a>
                  </div>
                  <div className="info-card">
                     <h3>Custom Pieces & Quotes</h3>
                     <a href="mailto:custom@berroastudio.com">custom@berroastudio.com</a>
                  </div>
               </div>
            </motion.div>

            {/* Interactive Channels */}
            <div className="region-label mt-4"><MessageSquare size={14}/> Canales Interactivos</div>
            <div className="interactive-channels">
               {/* WhatsApp */}
               <div className="info-card social-card whatsapp">
                  <div className="info-icon">
                     <Phone size={24} />
                  </div>
                  <h3>WhatsApp Business</h3>
                  <a href="https://wa.me/17325233816" target="_blank" rel="noopener noreferrer" className="action-link">Chatear ahora</a>
                  <div className="qr-box">
                    <BerroaQR value="https://wa.me/17325233816" label="Escanear WhatsApp" size={80} />
                  </div>
               </div>

               {/* Telegram */}
               <div className="info-card social-card telegram">
                  <div className="info-icon">
                     <Send size={24} />
                  </div>
                  <h3>Telegram Bot</h3>
                  <a href="https://t.me/Berroastudio_bot" target="_blank" rel="noopener noreferrer" className="action-link">@Berroastudio_bot</a>
                  <div className="qr-box">
                    <BerroaQR value="https://t.me/Berroastudio_bot" label="Escanear Bot" size={80} />
                  </div>
               </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="contact-form-wrapper">
             <div className="card-header">
                <h3>Envíanos un mensaje</h3>
                <p>Te responderemos en menos de 24 horas laborables.</p>
             </div>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-input" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input" />
                </div>
              </div>

              <div className="form-group">
                <label>Asunto</label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} required className="form-input" />
              </div>

              <div className="form-group">
                <label>Mensaje</label>
                <textarea name="message" value={formData.message} onChange={handleChange} required rows={4} className="form-input" />
              </div>

              {/* Security Footer in Form */}
              <div className="security-badges-container">
                 <div className="security-badge">
                    <ShieldCheck size={18} />
                    <span>Protegido por Cloudflare Turnstile</span>
                 </div>
                 <div className="security-badge">
                    <Lock size={16} />
                    <span>Transacción Segura via Stripe</span>
                 </div>
              </div>

              <div className="cf-turnstile" data-sitekey="0x4AAAAAAC15jMWuWb8r3Bcg" data-action="contact_form"></div>

              {submitStatus === 'success' && (
                <div className="alert alert-success">✅ Mensaje enviado exitosamente.</div>
              )}

              <button type="submit" disabled={isSubmitting} className="btn-submit">
                {isSubmitting ? 'Procesando...' : 'Enviar Consulta'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .region-group { margin-bottom: 2rem; }
        .region-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin-bottom: 1rem; display: flex; alignItems: center; gap: 8px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .info-card { padding: 1.25rem; background: var(--bg2); border-radius: 12px; border: 1px solid var(--border); }
        .info-card h3 { font-size: 0.8rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text); }
        .info-card a { font-size: 0.85rem; color: var(--blue); text-decoration: none; word-break: break-all; }
        
        .interactive-channels { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
        .social-card { text-align: center; position: relative; overflow: hidden; }
        .social-card .info-icon { margin: 0 auto 1rem; width: 48px; height: 48px; background: var(--bg-accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .action-link { display: inline-block; margin-bottom: 1.5rem; font-weight: 600; font-size: 0.8rem !important; }
        .qr-box { margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border); }

        .security-badges-container { display: flex; gap: 1rem; margin: 1.5rem 0; padding: 1rem; background: var(--bg2); border-radius: 8px; border: 1px dashed var(--border); }
        .security-badge { display: flex; align-items: center; gap: 8px; font-size: 0.65rem; color: var(--muted); font-weight: 600; }
        .security-badge svg { color: var(--blue); }

        @media (max-width: 768px) {
           .info-grid, .interactive-channels { grid-template-columns: 1fr; }
           .contact-content { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
