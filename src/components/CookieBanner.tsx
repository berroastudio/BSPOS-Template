import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cookieConsent = localStorage.getItem('bs-cookie-consent');
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('bs-cookie-consent', JSON.stringify({
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    localStorage.setItem('bs-cookie-consent', JSON.stringify({
      analytics: false,
      marketing: false,
      functional: true,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('bs-cookie-consent', JSON.stringify({
      analytics: (document.getElementById('analytics') as HTMLInputElement)?.checked || false,
      marketing: (document.getElementById('marketing') as HTMLInputElement)?.checked || false,
      functional: true,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
          className="cookie-banner"
        >
          <div className="cookie-content">
            <div className="cookie-header">
              <h3>🍪 Políticas de Privacidad y Cookies</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="icon-btn"
              >
                <X size={16} />
              </button>
            </div>

            <p className="cookie-description">
              Usamos cookies para mejorar tu experiencia, personalizar contenido y analizar nuestro tráfico.
              Al hacer clic en "Aceptar todo" aceptas el uso de todas las cookies. Puedes revisar y personalizar
              tus preferencias en cualquier momento.
            </p>

            <div className="cookie-preferences">
              <label className="cookie-checkbox">
                <input type="checkbox" defaultChecked disabled />
                <span>
                  <strong>Funcionales</strong>
                  <em>Necesarias para el funcionamiento del sitio</em>
                </span>
              </label>

              <label className="cookie-checkbox">
                <input type="checkbox" id="analytics" />
                <span>
                  <strong>Analíticas</strong>
                  <em>Nos ayudan a entender cómo usas nuestro sitio</em>
                </span>
              </label>

              <label className="cookie-checkbox">
                <input type="checkbox" id="marketing" />
                <span>
                  <strong>Marketing</strong>
                  <em>Personalizan tu experiencia y publicidad</em>
                </span>
              </label>
            </div>

            <div className="cookie-actions">
              <button onClick={handleRejectAll} className="btn btn-secondary">
                Rechazar
              </button>
              <button onClick={handleSavePreferences} className="btn btn-outline">
                Personalizar
              </button>
              <button onClick={handleAcceptAll} className="btn">
                Aceptar Todo
              </button>
            </div>

            <p className="cookie-footer">
              Lee nuestra <a href="/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidad</a> para
              más información.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
