import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  BookOpen, Search, ArrowLeft, ChevronRight, 
  Download, Globe, MessageCircle, AlertCircle,
  Play, CheckCircle2, Package
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { BSLoading } from "../components/BSLoading";

interface Instruction {
  id: string;
  title: string;
  description?: string;
  category?: string;
  steps: InstructionStep[];
}

interface InstructionStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  image_url?: string;
  video_url?: string;
}

export function InstructionPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [selected, setSelected] = useState<Instruction | null>(null);
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState<"es" | "en">(() => 
    (localStorage.getItem("bs-lang") as "es" | "en") || "es"
  );

  useEffect(() => {
    fetchInstructions();
    const handleLang = (e: any) => setLang(e.detail);
    window.addEventListener('bs-lang-change', handleLang);
    return () => window.removeEventListener('bs-lang-change', handleLang);
  }, []);

  useEffect(() => {
    if (id && instructions.length > 0) {
      const found = instructions.find(i => i.id === id);
      setSelected(found || null);
    } else {
      setSelected(null);
    }
  }, [id, instructions]);

  async function fetchInstructions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_instructions')
        .select('*, instruction_steps(*)');
      
      if (error) throw error;
      
      const sorted = (data || []).map((ins: any) => ({
        ...ins,
        steps: (ins.instruction_steps || []).sort((a: any, b: any) => a.step_number - b.step_number)
      }));
      setInstructions(sorted);
    } catch (err) {
      console.error("Error loading instructions:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = instructions.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    (i.description || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <BSLoading label="Cargando Manuales de Berroa Studio..." />;

  // ─── LIST VIEW ──────────────────────────────────────────
  if (!selected) {
    return (
      <div className="instr-layout">
        <header className="instr-header">
          <div className="instr-container">
            <div className="instr-hero">
              <div className="instr-badge">
                <BookOpen size={16} /> Instruction Library
              </div>
              <h1>Centro de Soporte y Manuales</h1>
              <p>Encuentra guías paso a paso para el armado, uso y mantenimiento de tus productos Berroa Studio.</p>
              
              <div className="instr-search-wrapper">
                <Search className="search-icon" size={20} />
                <input 
                  type="text" 
                  placeholder="¿Qué producto buscas? Ej. T-Shirt Print..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="instr-container">
          <div className="instr-grid">
            {filtered.length === 0 ? (
              <div className="no-results">
                <AlertCircle size={48} />
                <h3>No encontramos manuales para "{search}"</h3>
                <p>Intenta con otros términos o contáctanos por WhatsApp.</p>
              </div>
            ) : (
              filtered.map(ins => (
                <div key={ins.id} className="instr-card" onClick={() => navigate(`/i/${ins.id}`)}>
                  <div className="instr-card-icon">
                    <Package size={24} />
                  </div>
                  <div className="instr-card-content">
                    <h3>{ins.title}</h3>
                    <p>{ins.description || "Manual completo de uso y armado."}</p>
                    <div className="instr-card-meta">
                      <span>{ins.steps.length} Pasos</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        <style>{styles}</style>
      </div>
    );
  }

  // ─── DETAIL VIEW ────────────────────────────────────────
  return (
    <div className="instr-layout">
      <nav className="instr-nav">
        <div className="instr-container">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={18} /> Volver a la Biblioteca
          </button>
        </div>
      </nav>

      <main className="instr-container instr-detail">
        <div className="instr-meta-header">
          <div className="instr-category">{selected.category || "General"}</div>
          <h1>{selected.title}</h1>
          <p>{selected.description}</p>
          
          <div className="instr-actions">
            <button className="instr-btn primary" onClick={() => window.print()}>
              <Download size={16} /> Descargar PDF
            </button>
            <button className="instr-btn outline" onClick={() => window.open('https://wa.me/berroastudio', '_blank')}>
              <MessageCircle size={16} /> Soporte Técnico
            </button>
          </div>
        </div>

        <div className="steps-timeline">
          {selected.steps.map((step, idx) => (
            <div key={step.id} className="step-item">
              <div className="step-number-col">
                <div className="step-number">{step.step_number}</div>
                {idx !== selected.steps.length - 1 && <div className="step-line" />}
              </div>
              <div className="step-content-col">
                <div className="step-card">
                  {step.image_url && (
                    <div className="step-image-wrapper">
                      <img src={step.image_url} alt={step.title} />
                      {step.video_url && (
                        <button className="play-overlay">
                          <Play fill="currentColor" />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="step-info">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                    <div className="step-status">
                      <CheckCircle2 size={14} /> Listo para realizar
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="instr-footer">
          <div className="footer-card">
            <h3>¿Necesitas más ayuda?</h3>
            <p>Si tienes problemas con el armado o uso del producto, nuestro equipo está disponible 24/7.</p>
            <button onClick={() => window.open('https://wa.me/berroastudio', '_blank')}>Hablar con un Experto</button>
          </div>
        </div>
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .instr-layout {
    min-height: 100vh;
    background: #f8f9fc;
    color: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .instr-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* Header / Hero */
  .instr-header {
    background: #111;
    color: white;
    padding: 60px 0 100px;
    background-image: radial-gradient(circle at 20% 50%, rgba(186,199,253,0.15) 0%, transparent 50%);
    text-align: center;
  }

  .instr-hero h1 {
    font-size: 2.5rem;
    font-weight: 800;
    margin: 1rem 0;
    letter-spacing: -0.02em;
  }

  .instr-hero p {
    color: rgba(255,255,255,0.7);
    max-width: 600px;
    margin: 0 auto 2.5rem;
    font-size: 1.1rem;
    line-height: 1.6;
  }

  .instr-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #BAC7FD;
    color: #2E47B0;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .instr-search-wrapper {
    max-width: 500px;
    margin: 0 auto;
    position: relative;
    transform: translateY(20px);
  }

  .instr-search-wrapper input {
    width: 100%;
    padding: 18px 24px 18px 56px;
    border-radius: 16px;
    border: none;
    background: white;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    font-size: 1rem;
    outline: none;
    transition: all 0.3s;
  }

  .instr-search-wrapper input:focus {
    box-shadow: 0 15px 35px rgba(186,199,253,0.3);
    transform: scale(1.02);
  }

  .instr-search-wrapper .search-icon {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
  }

  /* Grid */
  .instr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: -30px;
    padding-bottom: 60px;
  }

  .instr-card {
    background: white;
    padding: 24px;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    gap: 16px;
    border: 1px solid transparent;
  }

  .instr-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.06);
    border-color: #BAC7FD;
  }

  .instr-card-icon {
    width: 48px;
    height: 48px;
    background: #f0f3ff;
    color: #2E47B0;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .instr-card-content h3 {
    margin: 0 0 8px 0;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .instr-card-content p {
    color: #666;
    font-size: 0.9rem;
    margin: 0 0 16px 0;
    line-height: 1.5;
  }

  .instr-card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    font-weight: 700;
    color: #2E47B0;
    text-transform: uppercase;
  }

  /* Detail View */
  .instr-nav {
    background: white;
    padding: 16px 0;
    border-bottom: 1px solid #eee;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .back-btn {
    background: none;
    border: none;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: #666;
    cursor: pointer;
    transition: color 0.2s;
  }

  .back-btn:hover { color: #1a1a1a; }

  .instr-meta-header {
    padding: 40px 0;
    text-align: center;
  }

  .instr-category {
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 800;
    color: #2E47B0;
    letter-spacing: 0.1em;
    margin-bottom: 8px;
  }

  .instr-meta-header h1 {
    font-size: 2.25rem;
    font-weight: 800;
    margin-bottom: 16px;
  }

  .instr-meta-header p {
    color: #666;
    max-width: 600px;
    margin: 0 auto 24px;
    line-height: 1.6;
  }

  .instr-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .instr-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .instr-btn.primary { background: #111; color: white; border: none; }
  .instr-btn.outline { background: white; color: #111; border: 1px solid #ddd; }
  .instr-btn:hover { transform: translateY(-2px); opacity: 0.9; }

  /* Timeline Steps */
  .steps-timeline {
    padding: 40px 0;
  }

  .step-item {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
  }

  .step-number-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 40px;
    flex-shrink: 0;
  }

  .step-number {
    width: 32px;
    height: 32px;
    background: #2E47B0;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.9rem;
    z-index: 2;
  }

  .step-line {
    width: 2px;
    flex: 1;
    background: #eef1f6;
    margin: 8px 0;
  }

  .step-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.04);
    border: 1px solid #eee;
  }

  .step-image-wrapper {
    position: relative;
    aspect-ratio: 16/9;
    background: #f0f0f0;
  }

  .step-image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .play-overlay {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 60px;
    height: 60px;
    background: rgba(46,71,176, 0.9);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .play-overlay:hover { transform: scale(1.1); }

  .step-info {
    padding: 24px;
  }

  .step-info h3 {
    margin: 0 0 10px 0;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .step-info p {
    color: #555;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .step-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #4CAF50;
    background: #f0f9f1;
    padding: 4px 10px;
    border-radius: 8px;
  }

  .instr-footer {
    padding: 40px 0 80px;
  }

  .footer-card {
    background: #BAC7FD;
    padding: 40px;
    border-radius: 24px;
    text-align: center;
    color: #2E47B0;
  }

  .footer-card h3 { font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; }
  .footer-card p { opacity: 0.8; margin-bottom: 24px; }
  .footer-card button {
    background: #2E47B0;
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  @media (max-width: 600px) {
    .step-item { flex-direction: column; gap: 12px; }
    .step-number-col { display: none; }
    .instr-hero h1 { font-size: 1.75rem; }
  }
`;
