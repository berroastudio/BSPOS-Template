import { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, Globe, Shield, Info, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getShippingCarriers, getShippingLocations, getShippingRates, type Currency } from '../lib/storefront-api';

interface ShippingCalculatorProps {
  weight_lb: number;
  currency: Currency;
  onSelect?: (option: any) => void;
}

const COUNTRIES = [
  { code: 'DO', name: 'República Dominicana', flag: '🇩🇴' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'WW', name: 'Resto del Mundo', flag: '🌐' }
];

export function ShippingCalculator({ weight_lb, currency }: ShippingCalculatorProps) {
  const [country, setCountry] = useState('DO');
  const [carriers, setCarriers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<string>('');
  const [showPickup, setShowPickup] = useState(false);
  const [countdown, setCountdown] = useState<string>('');

  // Fetch carriers based on country
  useEffect(() => {
    setLoading(true);
    getShippingCarriers({ country }).then(setCarriers).finally(() => setLoading(false));
    if (country === 'DO') {
      getShippingLocations({ is_pickup_point: showPickup }).then(setLocations);
    } else {
      setLocations([]);
    }
  }, [country, showPickup]);

  // Fetch rates
  useEffect(() => {
    if (carriers.length > 0) {
      getShippingRates({ weight_lb }).then(setRates);
    }
  }, [carriers, weight_lb]);

  // Espinal Countdown Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(18, 30, 0); // 6:30 PM standard

      if (now > cutoff) {
        setCountdown('Oficina cerrada - Abre mañana 7:00 AM');
      } else {
        const diff = cutoff.getTime() - now.getTime();
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        setCountdown(`Cierra en ${hrs}h ${mins}m para pickup hoy`);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const fmtPrice = (val: number) => {
    const symbol = currency === 'DOP' ? 'RD$' : currency === 'EUR' ? '€' : '$';
    return `${symbol}${val.toFixed(2)}`;
  };

  return (
    <div className="shipping-calc-box">
      <div className="calc-header">
        <Truck size={14} />
        <span>Calcular Envío ({weight_lb.toFixed(2)} lbs)</span>
      </div>

      <div className="country-grid">
        {COUNTRIES.map(c => (
          <button 
            key={c.code}
            className={`country-btn ${country === c.code ? 'active' : ''}`}
            onClick={() => setCountry(c.code)}
          >
            <span>{c.flag}</span>
            <span>{c.code}</span>
          </button>
        ))}
      </div>

      <div className="calc-content">
        {country === 'DO' && (
          <div className="do-options">
            <div className="pickup-toggle">
              <input 
                type="checkbox" 
                id="is-pickup" 
                checked={showPickup} 
                onChange={e => setShowPickup(e.target.checked)} 
              />
              <label htmlFor="is-pickup">Ver puntos de recogida (Pickup)</label>
            </div>

            <select 
              className="calc-select"
              value={selectedLoc}
              onChange={e => setSelectedLoc(e.target.value)}
            >
              <option value="">Selecciona Provincia/Sector</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.municipality} - {l.sector}</option>
              ))}
            </select>
          </div>
        )}

        <div className="carrier-list">
          {carriers.map(c => {
            const rate = rates.find(r => r.carrier_id === c.id);
            const isEspinal = c.code === 'ESPINAL';

            return (
              <motion.div 
                layout 
                key={c.id} 
                className="carrier-card"
              >
                <div className="carrier-info">
                  <div className="carrier-name-row">
                    <span className="carrier-name">{c.name}</span>
                    <span className="carrier-est">{c.est_delivery}</span>
                  </div>
                  {isEspinal && (
                    <div className="espinal-countdown">
                      <Clock size={10} />
                      <span>{countdown}</span>
                    </div>
                  )}
                </div>
                <div className="carrier-price">
                  {rate ? fmtPrice(currency === 'DOP' ? rate.price_dop : rate.price_usd) : 'Consultar'}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="shipping-footer">
        <Shield size={10} />
        <span>Tarifas dinámicas calculadas al toque</span>
      </div>

      <style>{`
        .shipping-calc-box {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem;
          margin: 1.5rem 0;
        }
        .calc-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--muted);
        }
        .country-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .country-btn {
          background: var(--card);
          border: 1px solid var(--border);
          padding: 0.5rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .country-btn.active {
          border-color: var(--accent);
          background: var(--accent-subtle);
          color: var(--accent);
        }
        .calc-select {
          width: 100%;
          padding: 0.6rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--card);
          font-size: 0.8rem;
          margin-bottom: 1rem;
        }
        .pickup-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .carrier-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .carrier-card {
          background: var(--card);
          padding: 0.75rem;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid transparent;
        }
        .carrier-card:hover { border-color: var(--border); }
        .carrier-name { font-size: 0.8rem; font-weight: 600; display: block; }
        .carrier-est { font-size: 0.65rem; color: var(--muted); }
        .carrier-price { font-size: 0.85rem; font-weight: 700; color: var(--accent); }
        .espinal-countdown {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.65rem;
          color: #f59e0b;
          margin-top: 0.2rem;
        }
        .shipping-footer {
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.6rem;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
