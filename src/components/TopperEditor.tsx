import React, { useState, useEffect, useRef } from 'react';
import { Minus, Plus, Maximize2, LayoutGrid, Moon, Sun, Info, Download, Trash2 } from 'lucide-react';

interface TopperEditorProps {
  onStateChange: (state: TopperState) => void;
  currency: string;
}

export interface TopperState {
  line1: string;
  line2: string;
  fontFamily: string;
  sizeLabel: 'Pequeño' | 'Mediano' | 'Grande';
  fontSize1: number;
  fontSize2: number;
  lineGap: number;
  color: string;
  showSticks: boolean;
  outlineMode: boolean;
}

const FONTS = [
  { name: 'Great Vibes', label: 'Great Vibes' },
  { name: 'Dancing Script', label: 'Dancing Script' },
  { name: 'Pacifico', label: 'Pacifico' },
  { name: 'Sacramento', label: 'Sacramento' },
  { name: 'Pinyon Script', label: 'Pinyon Script' },
  { name: 'Alex Brush', label: 'Alex Brush' },
  { name: 'Allura', label: 'Allura' },
  { name: 'Yellowtail', label: 'Yellowtail' },
  { name: 'Italianno', label: 'Italianno' },
  { name: 'Euphoria Script', label: 'Euphoria Script' },
  { name: 'Mr Dafoe', label: 'Mr Dafoe' },
  { name: 'Lobster', label: 'Lobster' },
];

const COLORS = [
  '#000000', '#1a1a2e', '#2d2d2d', '#4a0e0e', '#6b3a2a', '#8b4513',
  '#c0392b', '#e74c3c', '#e67e22', '#f39c12', '#f5c842', '#27ae60',
  '#2980b9', '#8e44ad', '#ffffff', '#d4af37',
];

const SIZE_CONFIG = {
  'Pequeño': { price: { USD: 15, DOP: 900 }, scale: 0.8 },
  'Mediano': { price: { USD: 22, DOP: 1300 }, scale: 1.0 },
  'Grande': { price: { USD: 28, DOP: 1650 }, scale: 1.25 },
};

export function TopperEditor({ onStateChange, currency }: TopperEditorProps) {
  const [state, setState] = useState<TopperState>({
    line1: 'Happy',
    line2: 'Birthday',
    fontFamily: 'Great Vibes',
    sizeLabel: 'Mediano',
    fontSize1: 90,
    fontSize2: 110,
    lineGap: 10,
    color: '#000000',
    showSticks: true,
    outlineMode: false,
  });

  const [bgMode, setBgMode] = useState<'white' | 'grid' | 'dark'>('white');
  const measureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    onStateChange(state);
  }, [state, onStateChange]);

  const update = (patch: Partial<TopperState>) => {
    setState(prev => ({ ...prev, ...patch }));
  };

  const estimateWidth = (text: string, size: number, font: string) => {
    if (!measureCanvasRef.current) {
        measureCanvasRef.current = document.createElement('canvas');
    }
    const ctx = measureCanvasRef.current.getContext('2d');
    if (!ctx) return text.length * (size * 0.5);
    ctx.font = `${size}px '${font}', cursive`;
    return ctx.measureText(text).width;
  };

  // Rendering logic
  const PAD_X = 60;
  const PAD_Y = 30;
  const LINE_H1 = state.fontSize1 * 1.1;
  const LINE_H2 = state.fontSize2 * 1.1;

  const estW1 = estimateWidth(state.line1, state.fontSize1, state.fontFamily);
  const estW2 = estimateWidth(state.line2, state.fontSize2, state.fontFamily);
  const maxW = Math.max(estW1, estW2, 200);

  const svgW = maxW + PAD_X * 2;
  const totalTextH = LINE_H1 + state.lineGap + LINE_H2;
  const stickAreaH = state.showSticks ? 90 : 0;
  const svgH = totalTextH + PAD_Y * 2 + stickAreaH;

  const y1 = PAD_Y + LINE_H1 * 0.85;
  const y2 = y1 + state.lineGap + LINE_H2 * 1.0;
  const cx = svgW / 2;

  const stickX1 = cx - maxW * 0.22;
  const stickX2 = cx + maxW * 0.22;
  const stickTop = y2 + LINE_H2 * 0.15;
  const stickBot = stickTop + stickAreaH;

  const fillAttr = state.outlineMode
    ? { fill: 'none', stroke: state.color, strokeWidth: '1.5' }
    : { fill: state.color };

  const renderWatermark = () => {
    const reps = [];
    const step = 90;
    for (let y = 0; y < svgH; y += step) {
      for (let x = -30; x < svgW; x += 180) {
        reps.push(
          <text 
            key={`${x}-${y}`} 
            x={x} y={y} 
            transform={`rotate(-30,${x},${y})`}
            fontFamily="'DM Sans', sans-serif"
            fontSize="10"
            fill="rgba(0,0,0,0.08)"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            Berroa Studio Toppers
          </text>
        );
      }
    }
    return reps;
  };

  return (
    <div className="bo-stack topper-editor-container">
      {/* CSS overrides for fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@700&family=Pacifico&family=Sacramento&family=Pinyon+Script&family=Alex+Brush&family=Allura&family=Yellowtail&family=Italianno&family=Euphoria+Script&family=Mr+Dafoe&family=Lobster&display=swap" rel="stylesheet" />
      
      <div className="topper-editor-grid">
        {/* Controls Panel */}
        <div className="topper-panel bo-stack" style={{ gap: '1.25rem' }}>
          <div>
            <h4 className="topper-sec-title">✦ Personalización</h4>
            <div className="bo-stack" style={{ gap: '0.75rem' }}>
              <div className="topper-field">
                <label>Línea 1</label>
                <input className="bo-input" value={state.line1} onChange={e => update({ line1: e.target.value })} placeholder="Ej: Happy" />
              </div>
              <div className="topper-field">
                <label>Línea 2</label>
                <input className="bo-input" value={state.line2} onChange={e => update({ line2: e.target.value })} placeholder="Ej: Birthday" />
              </div>
            </div>
          </div>

          <div>
             <h4 className="topper-sec-title">✦ Tamaño y Precio</h4>
             <div className="bo-row" style={{ gap: '0.5rem' }}>
                {(['Pequeño', 'Mediano', 'Grande'] as const).map(sz => (
                  <button 
                    key={sz}
                    className={`bo-btn outline btn-sm ${state.sizeLabel === sz ? 'active' : ''}`}
                    style={{ flex: 1, textTransform: 'none', padding: '10px 4px' }}
                    onClick={() => update({ sizeLabel: sz })}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 700 }}>{sz}</div>
                    <div style={{ fontSize: '9px', opacity: 0.7 }}>{(currency === 'DOP' ? 'RD$' : '$') + (currency === 'DOP' ? SIZE_CONFIG[sz].price.DOP : SIZE_CONFIG[sz].price.USD)}</div>
                  </button>
                ))}
             </div>
          </div>

          <div>
            <h4 className="topper-sec-title">✦ Tipografía</h4>
            <div className="topper-font-grid">
              {FONTS.map(f => (
                <button 
                  key={f.name}
                  className={`topper-font-item ${state.fontFamily === f.name ? 'active' : ''}`}
                  onClick={() => update({ fontFamily: f.name })}
                >
                  <span style={{ fontFamily: `'${f.name}', cursive`, fontSize: '1.2rem' }}>{f.label}</span>
                  <span className="font-name-tag">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="topper-sec-title">✦ Ajustes Dinámicos</h4>
            <div className="bo-stack" style={{ gap: '0.5rem' }}>
              <div className="topper-slider-field">
                <div className="bo-between">
                  <label>Tamaño Texto</label>
                  <span>{state.fontSize1}px</span>
                </div>
                <input type="range" min="40" max="180" value={state.fontSize1} onChange={e => update({ fontSize1: +e.target.value, fontSize2: +e.target.value * 1.2 })} />
              </div>
              <div className="topper-slider-field">
                <div className="bo-between">
                  <label>Separación (Kerning)</label>
                  <span>{state.lineGap}px</span>
                </div>
                <input type="range" min="-20" max="60" value={state.lineGap} onChange={e => update({ lineGap: +e.target.value })} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="topper-sec-title">✦ Color & Estilo</h4>
            <div className="topper-color-grid">
              {COLORS.map(c => (
                <button 
                  key={c}
                  className={`topper-swatch ${state.color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => update({ color: c })}
                />
              ))}
            </div>
            <div className="bo-row" style={{ marginTop: '1rem', justifyContent: 'space-between' }}>
               <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Mostrar palitos</span>
               <input type="checkbox" checked={state.showSticks} onChange={e => update({ showSticks: e.target.checked })} />
            </div>
          </div>
        </div>

        {/* Canvas Display */}
        <div className={`topper-canvas-area preview-mode-${bgMode}`}>
          <div className="topper-canvas-toolbar">
            <button className={`bo-icon-btn ${bgMode === 'white' ? 'active' : ''}`} onClick={() => setBgMode('white')}><Sun size={14}/></button>
            <button className={`bo-icon-btn ${bgMode === 'grid' ? 'active' : ''}`} onClick={() => setBgMode('grid')}><LayoutGrid size={14}/></button>
            <button className={`bo-icon-btn ${bgMode === 'dark' ? 'active' : ''}`} onClick={() => setBgMode('dark')}><Moon size={14}/></button>
          </div>

          <div className="topper-svg-wrap">
            <svg 
              viewBox={`0 0 ${svgW} ${svgH}`} 
              width={svgW} height={svgH}
              style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            >
              {state.showSticks && (
                <>
                  <rect x={stickX1 - 2} y={stickTop} width={4} height={stickAreaH} rx="2" fill="#c8a050" opacity={0.8} />
                  <rect x={stickX2 - 2} y={stickTop} width={4} height={stickAreaH} rx="2" fill="#c8a050" opacity={0.8} />
                </>
              )}

              <text
                x={cx} y={y1}
                fontFamily={`'${state.fontFamily}', cursive`}
                fontSize={state.fontSize1}
                textAnchor="middle"
                {...fillAttr}
              >
                {state.line1}
              </text>

              <text
                x={cx} y={y2}
                fontFamily={`'${state.fontFamily}', cursive`}
                fontSize={state.fontSize2}
                textAnchor="middle"
                {...fillAttr}
              >
                {state.line2}
              </text>

              {renderWatermark()}
            </svg>
          </div>

          <div className="topper-canvas-footer">
            <Info size={12} /> Personalización en vivo para producción artesanal
          </div>
        </div>
      </div>

      <style>{`
        .topper-editor-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 1.5rem;
          min-height: 500px;
        }

        @media (max-width: 900px) {
          .topper-editor-grid { grid-template-columns: 1fr; }
        }

        .topper-panel {
          background: var(--bg2);
          border-radius: var(--r);
          padding: 1.25rem;
          border: 1px solid var(--border);
        }

        .topper-sec-title {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--muted);
          margin-bottom: 0.75rem;
          font-weight: 700;
        }

        .topper-field label {
          font-size: 0.75rem;
          color: var(--muted);
          margin-bottom: 0.25rem;
          display: block;
        }

        .topper-font-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
          max-height: 180px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .topper-font-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          cursor: pointer;
          transition: var(--t);
        }

        .topper-font-item:hover { border-color: var(--text); }
        .topper-font-item.active { border-color: var(--accent); background: var(--bg3); }

        .font-name-tag {
          font-size: 0.6rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .topper-slider-field input {
          width: 100%;
          height: 4px;
          background: var(--border);
          border-radius: 4px;
          outline: none;
        }

        .topper-color-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
        }

        .topper-swatch {
          aspect-ratio: 1;
          border-radius: 4px;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: var(--t);
        }

        .topper-swatch.active { border: 2px solid var(--text); transform: scale(1.1); }

        .topper-canvas-area {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--r);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          transition: var(--t);
        }

        .preview-mode-dark { background: #1a1a1a !important; }
        .preview-mode-grid { 
          background-image: radial-gradient(var(--border) 1px, transparent 1px) !important;
          background-size: 20px 20px !important;
        }

        .topper-canvas-toolbar {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          gap: 0.5rem;
        }

        .topper-svg-wrap {
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
        }

        .topper-canvas-footer {
          padding: 1rem;
          font-size: 0.65rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}
