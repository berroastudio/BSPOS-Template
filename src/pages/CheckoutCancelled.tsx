import { XCircle, ArrowLeft, RefreshCw, HelpCircle, ShieldAlert } from 'lucide-react';

const CANCEL_REASONS = [
  {
    icon: ShieldAlert,
    title: 'Pago no completado',
    desc: 'El proceso de pago fue cancelado o no se pudo completar. No se realizó ningún cargo.',
  },
  {
    icon: RefreshCw,
    title: 'Puedes intentar de nuevo',
    desc: 'Tu carrito sigue intacto. Vuelve a la tienda para completar tu compra cuando estés listo.',
  },
  {
    icon: HelpCircle,
    title: '¿Problemas con tu tarjeta?',
    desc: 'Verifica que tu tarjeta esté habilitada para compras internacionales o intenta con otra tarjeta.',
  },
];

export function CheckoutCancelled() {
  return (
    <div className="checkout-result">
      <div className="result-card cancelled">
        <div className="result-icon-wrap cancel-glow">
          <XCircle size={48} strokeWidth={1.5} />
        </div>

        <h1 className="result-title">Pago No Completado</h1>
        <p className="result-subtitle">
          No te preocupes — no se realizó ningún cargo a tu tarjeta.
        </p>

        <div className="cancel-reasons">
          {CANCEL_REASONS.map((r, i) => (
            <div key={i} className="cancel-reason">
              <r.icon size={18} />
              <div>
                <div className="reason-title">{r.title}</div>
                <div className="reason-desc">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="result-actions">
          <a href="/" className="btn btn-solid btn-full">
            <ArrowLeft size={14} /> Volver a la Tienda
          </a>
        </div>

        <p className="result-footer">
          Si crees que hubo un error, escríbenos a <strong>soporte@berroastudio.com</strong>
        </p>
      </div>
    </div>
  );
}
