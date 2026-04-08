import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, ShieldCheck, Lock, Globe, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { BerroaQR } from '../components/BerroaQR';

export function ContactPage() {
  const [region, setRegion] = useState<'RD' | 'USA'>('RD');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const host = window.location.hostname;
    if (host.includes('usa') || host.includes('worldwide') || host.includes('us.')) {
      setRegion('USA');
    } else {
      setRegion('RD');
    }
  }, []);

  const t = (rd: string, usa: string) => region === 'RD' ? rd : usa;

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
          <div className="bo-badge blue mb-2">{t('Soporte Global', 'Global Support')}</div>
          <h1>{t('Canales de Atención', 'Support Channels')}</h1>
          <p>{t('Selecciona el canal más conveniente para tu región o necesidad.', 'Select the most convenient channel for your region or needs.')}</p>
        </motion.div>

        <div className="contact-content">
          {/* Info Side */}
          <div className="contact-info">
            
            {/* REGION: RD */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`region-group ${region === 'RD' ? 'active-region' : ''}`}>
               <div className="region-label"><Globe size={14}/> República Dominicana</div>
               <div className="info-grid">
                  <div className="info-card">
                     <h3>{t('Ventas y Órdenes', 'Sales & Orders')}</h3>
                     <a href="mailto:ventas@berroastudio.com">ventas@berroastudio.com</a>
                  </div>
                  <div className="info-card">
                     <h3>{t('Soporte Técnico', 'Technical Support')}</h3>
                     <a href="mailto:soporte@berroastudio.com">soporte@berroastudio.com</a>
                  </div>
               </div>
            </motion.div>

            {/* REGION: USA */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`region-group ${region === 'USA' ? 'active-region' : ''}`}>
               <div className="region-label"><Globe size={14}/> United States</div>
               <div className="info-grid">
                  <div className="info-card">
                     <h3>{t('Ventas y Consultas', 'Sales & General Inquiries')}</h3>
                     <a href="mailto:sales@berroastudio.com">sales@berroastudio.com</a>
                  </div>
                  <div className="info-card">
                     <h3>{t('Piezas Personalizadas', 'Custom Pieces & Quotes')}</h3>
                     <a href="mailto:custom@berroastudio.com">custom@berroastudio.com</a>
                  </div>
               </div>
            </motion.div>

            {/* Interactive Channels */}
            <div className="region-label mt-4"><MessageSquare size={14}/> {t('Canales Interactivos', 'Interactive Channels')}</div>
            <div className="interactive-channels">
               {/* WhatsApp */}
               <div className="info-card social-card whatsapp">
                  <div className="info-icon">
                     <Phone size={24} />
                  </div>
                  <h3>WhatsApp Business</h3>
                  <a href="https://wa.me/17325233816" target="_blank" rel="noopener noreferrer" className="action-link">{t('Chatear ahora', 'Chat now')}</a>
                  <div className="qr-box">
                    <BerroaQR value="https://wa.me/17325233816" label={t('Escanear WhatsApp', 'Scan WhatsApp')} size={80} />
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
                    <BerroaQR value="https://t.me/Berroastudio_bot" label={t('Escanear Bot', 'Scan Bot')} size={80} />
                  </div>
               </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="contact-form-wrapper">
             <div className="card-header">
                <h3>{t('Envíanos un mensaje', 'Send us a message')}</h3>
                <p>{t('Te responderemos en menos de 24 horas laborables.', 'We will respond in less than 24 business hours.')}</p>
             </div>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('Nombre', 'Full Name')}</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-input" placeholder={t('Tu nombre...', 'Your name...')} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input" placeholder="email@example.com" />
                </div>
              </div>

              <div className="form-group">
                <label>{t('Asunto', 'Subject')}</label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} required className="form-input" placeholder={t('¿En qué podemos ayudarte?', 'How can we help you?')} />
              </div>

              <div className="form-group">
                <label>{t('Mensaje', 'Message')}</label>
                <textarea name="message" value={formData.message} onChange={handleChange} required rows={5} className="form-input" placeholder={t('Tu mensaje detallado...', 'Your detailed message...')} />
              </div>

              {/* Security Footer in Form */}
              <div className="security-badges-container">
                 <div className="security-badge">
                    <ShieldCheck size={18} />
                    <span>{t('Protegido por Cloudflare', 'Protected by Cloudflare')}</span>
                 </div>
                 <div className="security-badge">
                    <Lock size={16} />
                    <span>{t('Pagos Seguros via Stripe', 'Secure Payments via Stripe')}</span>
                 </div>
              </div>

              <div className="cf-turnstile" data-sitekey="0x4AAAAAAC15jMWuWb8r3Bcg" data-action="contact_form"></div>

              {submitStatus === 'success' && (
                <div className="alert alert-success">✅ {t('Mensaje enviado exitosamente.', 'Message sent successfully.')}</div>
              )}
              {submitStatus === 'error' && (
                <div className="alert alert-error">❌ {t('Error al enviar. Inténtalo de nuevo.', 'Error sending. Please try again.')}</div>
              )}

              <button type="submit" disabled={isSubmitting} className="btn-submit">
                {isSubmitting ? t('Procesando...', 'Processing...') : t('Enviar Consulta', 'Submit Inquiry')}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .contact-page { padding: 4rem 0; background: var(--bg); }
        .contact-header { text-align: center; margin-bottom: 4rem; max-width: 600px; margin-left: auto; margin-right: auto; }
        .contact-header h1 { font-size: 2.5rem; font-weight: 800; margin: 1rem 0; }
        .contact-header p { color: var(--muted); font-size: 1.1rem; }

        .contact-content { display: grid; grid-template-columns: 1fr 450px; gap: 4rem; align-items: start; }
        
        .region-group { margin-bottom: 2rem; padding: 1rem; border-radius: 16px; transition: all 0.3s ease; }
        .region-group.active-region { background: var(--bg2); border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
        
        .region-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2.5px; color: var(--muted); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 10px; font-weight: 700; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .info-card { padding: 1.5rem; background: var(--bg); border-radius: 12px; border: 1px solid var(--border); transition: transform 0.2s; }
        .info-card:hover { transform: translateY(-4px); border-color: var(--blue); }
        .info-card h3 { font-size: 0.85rem; font-weight: 800; margin-bottom: 0.75rem; color: var(--text); }
        .info-card a { font-size: 0.9rem; color: var(--blue); text-decoration: none; word-break: break-all; font-weight: 500; }
        
        .interactive-channels { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-top: 1rem; }
        .social-card { text-align: center; position: relative; overflow: hidden; }
        .social-card .info-icon { margin: 0 auto 1.25rem; width: 56px; height: 56px; background: var(--bg2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--blue); }
        .action-link { display: inline-block; margin-bottom: 1.5rem; font-weight: 700; font-size: 0.85rem !important; color: var(--blue); }
        .qr-box { margin-top: 0.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border); }

        .contact-form-wrapper { background: var(--bg2); border-radius: 20px; border: 1px solid var(--border); overflow: hidden; box-shadow: var(--shadow-lg); }
        .card-header { padding: 2rem; background: var(--bg3); border-bottom: 1px solid var(--border); }
        .card-header h3 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; }
        .card-header p { font-size: 0.9rem; color: var(--muted); }
        
        .contact-form { padding: 2rem; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text); }
        .form-input { width: 100%; padding: 1rem; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; font-size: 0.95rem; color: var(--text); transition: all 0.2s; }
        .form-input:focus { outline: none; border-color: var(--blue); ring: 2px solid rgba(0,102,255,0.1); }
        
        .security-badges-container { display: flex; flex-direction: column; gap: 0.75rem; margin: 2rem 0; padding: 1.25rem; background: var(--bg); border-radius: 12px; border: 1px dashed var(--border); }
        .security-badge { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; color: var(--muted); font-weight: 600; }
        .security-badge svg { color: var(--blue); }

        .btn-submit { 
          width: 100%; 
          padding: 1.25rem; 
          background: #000; 
          color: #fff; 
          border: none; 
          border-radius: 12px; 
          font-weight: 800; 
          font-size: 1.1rem; 
          cursor: pointer; 
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 64px;
        }
        .btn-submit:hover { background: #222; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .alert { padding: 1rem; border-radius: 10px; font-size: 0.9rem; font-weight: 600; margin-bottom: 1.5rem; }
        .alert-success { background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2); }
        .alert-error { background: rgba(239, 68, 68, 0.1); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.2); }

        @media (max-width: 1024px) {
           .contact-content { grid-template-columns: 1fr; gap: 3rem; }
           .contact-form-wrapper { max-width: 600px; margin: 0 auto; width: 100%; }
        }
        
        @media (max-width: 768px) {
           .form-grid { grid-template-columns: 1fr; }
           .info-grid, .interactive-channels { grid-template-columns: 1fr; }
           .contact-header h1 { font-size: 2rem; }
        }
      `}</style>
    </div>
  );
}
