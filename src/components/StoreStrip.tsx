import { Globe, MapPin } from 'lucide-react';
import { STORES, type StoreId } from '../config/stores';

interface StoreStripProps {
  activeStore: StoreId;
  onStoreChange: (id: StoreId) => void;
}

export function StoreStrip({ activeStore, onStoreChange }: StoreStripProps) {
  const s = STORES[activeStore];

  return (
    <div className="store-strip">
      {Object.values(STORES).map(st => (
        <button
          key={st.id}
          className={`store-btn${activeStore === st.id ? ' active' : ''}`}
          onClick={() => onStoreChange(st.id as StoreId)}
        >
          {st.flag} {st.subtitle}
          {st.country === 'DO' ? <MapPin size={10} /> : <Globe size={10} />}
        </button>
      ))}
      <span className="strip-info">
        {s.country === 'DO' ? <MapPin size={10} /> : <Globe size={10} />}
        {s.description}
      </span>
    </div>
  );
}
