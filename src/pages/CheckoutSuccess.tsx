import { useEffect, useState } from 'react';
import { CheckCircle, Package, ArrowLeft, Mail, Truck } from 'lucide-react';

export function CheckoutSuccess() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get('session_id'));
  }, []);

  return (
    <div className="checkout-result">
      <div className="result-card success">
        <div className="result-icon-wrap success-glow">
          <CheckCircle size={48} strokeWidth={1.5} />
        </div>

        <h1 className="result-title">¡Pago Exitoso!</h1>
        <p className="result-subtitle">
          Tu orden ha sido confirmada y está siendo procesada.
        </p>

        <div className="result-details">
          <div className="detail-row">
            <Mail size={15} />
            <span>Recibirás un email de confirmación en breve</span>
          </div>
          <div className="detail-row">
            <Package size={15} />
            <span>Tu pedido está siendo preparado</span>
          </div>
          <div className="detail-row">
            <Truck size={15} />
            <span>Te notificaremos cuando se envíe</span>
          </div>
        </div>

        {sessionId && (
          <div className="session-ref">
            <span className="ref-label">Referencia</span>
            <code className="ref-code">{sessionId.slice(0, 20)}…</code>
          </div>
        )}

        <div className="result-actions">
          <a href="/" className="btn btn-solid btn-full">
            <ArrowLeft size={14} /> Volver a la Tienda
          </a>
        </div>

        <p className="result-footer">
          ¿Necesitas ayuda? Escríbenos a <strong>soporte@berroastudio.com</strong>
        </p>
      </div>
    </div>
  );
}
