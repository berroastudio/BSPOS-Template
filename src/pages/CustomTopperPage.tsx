import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Download, Type, Maximize, Palette, 
  Layers, Package, ChevronLeft, Save, 
  Trash2, HelpCircle 
} from 'lucide-react';

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
  '#000000','#1a1a2e','#2d2d2d','#4a0e0e','#6b3a2a','#8b4513',
  '#c0392b','#e74c3c','#e67e22','#f39c12','#f5c842','#27ae60',
  '#2980b9','#8e44ad','#ffffff','#f8f8f8','#d4af37',
];

export function CustomTopperPage() {
  const [line1, setLine1] = useState("Happy");
  const [line2, setLine2] = useState("Birthday");
  const [currentFont, setCurrentFont] = useState("Great Vibes");
  const [currentColor, setCurrentColor] = useState("#f5c842");
  const [size1, setSize1] = useState(90);
  const [size2, setSize2] = useState(110);
  const [lineGap, setLineGap] = useState(10);
  const [showSticks, setShowSticks] = useState(true);
  const [outlineMode, setOutlineMode] = useState(false);
  const [bgMode, setBgMode] = useState<'white' | 'grid' | 'dark'>('grid');

  const canvasRef = useRef<SVGSVGElement>(null);

  // SVG Calculations
  const PAD_X = 60;
  const PAD_Y = 30;
  const LINE_H1 = size1 * 1.1;
  const LINE_H2 = size2 * 1.1;

  // Approximate width estimation (could be improved with a real canvas measure)
  function estimateWidth(text: string, size: number) {
    return text.length * (size * 0.45); // Rough avg for cursive
  }

  const estimatedW1 = useMemo(() => estimateWidth(line1, size1), [line1, size1]);
  const estimatedW2 = useMemo(() => estimateWidth(line2, size2), [line2, size2]);
  const maxW = Math.max(estimatedW1, estimatedW2, 200);

  const svgW = maxW + PAD_X * 2;
  const totalTextH = LINE_H1 + lineGap + LINE_H2;
  const stickAreaH = showSticks ? 90 : 0;
  const svgH = totalTextH + PAD_Y * 2 + stickAreaH;

  const y1 = PAD_Y + LINE_H1 * 0.85;
  const y2 = y1 + lineGap + LINE_H2 * 1.0;
  const cx = svgW / 2;

  const stickX1 = cx - maxW * 0.22;
  const stickX2 = cx + maxW * 0.22;
  const stickTop = y2 + LINE_H2 * 0.15;
  const stickBot = stickTop + stickAreaH;

  const fillAttr = outlineMode
    ? { fill: "none", stroke: currentColor, strokeWidth: "1.5" }
    : { fill: currentColor };

  const handleDownloadSVG = () => {
    const svgData = canvasRef.current?.outerHTML;
    if (!svgData) return;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topper-custom-${line1}.svg`;
    a.click();
  };

  return (
    <div className="te-layout" style={{ 
      display: 'flex', 
      height: '100vh', 
      background: '#111', 
      color: '#eee',
      fontFamily: 'sans-serif'
    }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '320px', 
        background: '#16161e', 
        borderRight: '1px solid #2e2e3a',
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div onClick={() => window.location.href = '/'} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#f5c842', marginBottom: '8px' }}>
          <ChevronLeft size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Volver a la tienda</span>
        </div>

        <header>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'serif', fontStyle: 'italic' }}>Topper Studio</h1>
          <p style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Custom Cake Topper Live Editor</p>
        </header>

        {/* Text Section */}
        <div className="te-section">
          <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#555', letterSpacing: '2px', display: 'block', marginBottom: '12px' }}>Texto del Topper</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="te-field">
              <label style={{ fontSize: '0.7rem', color: '#888', display: 'block', marginBottom: '6px' }}>Línea 1</label>
              <input 
                type="text" 
                value={line1} 
                onChange={(e) => setLine1(e.target.value)}
                style={{ width: '100%', background: '#1e1e26', border: '1px solid #2e2e3a', borderRadius: '8px', color: '#fff', padding: '10px' }}
              />
            </div>
            <div className="te-field">
              <label style={{ fontSize: '0.7rem', color: '#888', display: 'block', marginBottom: '6px' }}>Línea 2</label>
              <input 
                type="text" 
                value={line2} 
                onChange={(e) => setLine2(e.target.value)}
                style={{ width: '100%', background: '#1e1e26', border: '1px solid #2e2e3a', borderRadius: '8px', color: '#fff', padding: '10px' }}
              />
            </div>
          </div>
        </div>

        {/* Fonts */}
        <div className="te-section">
          <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#555', letterSpacing: '2px', display: 'block', marginBottom: '12px' }}>Tipografía</label>
          <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
            {FONTS.map(f => (
              <button 
                key={f.name}
                onClick={() => setCurrentFont(f.name)}
                style={{ 
                  background: currentFont === f.name ? '#28280f' : '#1e1e26',
                  border: `1px solid ${currentFont === f.name ? '#f5c842' : '#2e2e3a'}`,
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontFamily: `'${f.name}', cursive`,
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="te-section">
          <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#555', letterSpacing: '2px', display: 'block', marginBottom: '12px' }}>Color del Material</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
            {COLORS.map(c => (
              <button 
                key={c}
                onClick={() => setCurrentColor(c)}
                style={{ 
                  background: c,
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '6px',
                  border: currentColor === c ? '2px solid #f5c842' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="te-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="te-field">
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <label style={{ fontSize: '0.7rem', color: '#888' }}>Tamaño Línea 1</label>
               <span style={{ fontSize: '0.7rem', color: '#f5c842' }}>{size1}</span>
             </div>
             <input type="range" min="40" max="200" value={size1} onChange={(e) => setSize1(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div className="te-field">
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <label style={{ fontSize: '0.7rem', color: '#888' }}>Tamaño Línea 2</label>
               <span style={{ fontSize: '0.7rem', color: '#f5c842' }}>{size2}</span>
             </div>
             <input type="range" min="40" max="200" value={size2} onChange={(e) => setSize2(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handleDownloadSVG} style={{ background: '#f5c842', color: '#111', padding: '12px', borderRadius: '10px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
            DESCARGAR SVG
          </button>
          <p style={{ fontSize: '0.6rem', color: '#555', textAlign: 'center' }}>Listo para Cricut Design Space</p>
        </div>
      </aside>

      {/* Canvas Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px' }}>
          {['white', 'grid', 'dark'].map(m => (
            <button key={m} onClick={() => setBgMode(m as any)} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
              background: bgMode === m ? '#f5c842' : '#1e1e26',
              color: bgMode === m ? '#111' : '#666',
              border: 'none'
            }}>{m.toUpperCase()}</button>
          ))}
        </div>

        <div style={{ 
          background: bgMode === 'white' ? '#fff' : bgMode === 'dark' ? '#1a1a1a' : '#fff',
          backgroundImage: bgMode === 'grid' ? 'repeating-linear-gradient(0deg, transparent, transparent 19px, #eee 19px, #eee 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #eee 19px, #eee 20px)' : 'none',
          padding: '40px 60px',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxWidth: '90%',
          maxHeight: '80%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg 
            ref={canvasRef}
            width={svgW} 
            height={svgH} 
            viewBox={`0 0 ${svgW} ${svgH}`}
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
          >
            {showSticks && (
              <>
                <rect x={stickX1 - 2} y={stickTop} width="4" height={stickAreaH} rx="2" fill="#c8a050" />
                <rect x={stickX2 - 2} y={stickTop} width="4" height={stickAreaH} rx="2" fill="#c8a050" />
              </>
            )}

            <text 
              x={cx} y={y1} 
              fontFamily={`'${currentFont}', cursive`} 
              fontSize={size1} 
              textAnchor="middle" 
              {...fillAttr}
            >
              {line1}
            </text>

            <text 
              x={cx} y={y2} 
              fontFamily={`'${currentFont}', cursive`} 
              fontSize={size2} 
              textAnchor="middle" 
              {...fillAttr}
            >
              {line2}
            </text>
            
            {/* Watermark only for view */}
            <text x={0} y={svgH} fontSize="10" fill="rgba(0,0,0,0.1)" fontFamily="sans-serif" pointerEvents="none" style={{ userSelect: 'none' }}>
              PREVIEW ONLY - BERROA STUDIO
            </text>
          </svg>
        </div>

        <p style={{ marginTop: '24px', fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Vista previa en tiempo real · Medición inteligente
        </p>
      </main>
    </div>
  );
}
