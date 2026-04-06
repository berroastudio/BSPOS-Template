import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Cargar variables de entorno de .env.local
config({ path: path.join(process.cwd(), '.env.local') });

// Lazy initialization de Supabase (Backend)
let supabaseAdmin: any = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key are required for backend operations');
    }
    supabaseAdmin = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseAdmin;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(express.json());

  // ==========================================
  // API ROUTES (Backend)
  // ==========================================
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Berroa Studio Storefront API is running" });
  });

  // Validar código promocional
  app.post("/api/validate-promo", async (req, res) => {
    try {
      const { code, subtotal, currency } = req.body;
      if (!code) return res.status(400).json({ valid: false, message: 'Código requerido' });

      const supabase = getSupabaseAdmin();
      const { data: promo, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('status', 'active')
        .single();

      if (error || !promo) {
        return res.json({ valid: false, message: 'Código no válido o expirado' });
      }

      // Validar fechas
      const now = new Date();
      if (promo.start_date && new Date(promo.start_date) > now) {
        return res.json({ valid: false, message: 'Esta promoción aún no ha comenzado' });
      }
      if (promo.end_date && new Date(promo.end_date) < now) {
        return res.json({ valid: false, message: 'Esta promoción ha expirado' });
      }

      // Validar compra mínima según moneda
      const minKey = `min_purchase_${currency.toLowerCase()}`;
      const minPurchase = promo[minKey] || 0;
      if (subtotal < minPurchase) {
        return res.json({ 
          valid: false, 
          message: `Compra mínima requerida: ${currency} ${minPurchase}` 
        });
      }

      // Calcular descuento
      let discountAmount = 0;
      if (promo.type === 'percentage') {
        discountAmount = (subtotal * promo.value) / 100;
      } else if (promo.type === 'fixed_amount') {
        discountAmount = promo.value;
      } else if (promo.type === 'shipping') {
        // El frontend maneja el envío gratis si valid: true y promo.type === 'shipping'
        discountAmount = 0; 
      }

      res.json({
        valid: true,
        message: 'Código aplicado correctamente',
        discountAmount,
        promoId: promo.id,
        type: promo.type
      });

    } catch (error: any) {
      console.error('Error validating promo:', error);
      res.status(500).json({ valid: false, message: 'Error interno del servidor' });
    }
  });

  // ==========================================
  // VITE MIDDLEWARE (Frontend)
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Storefront running on http://localhost:${PORT}`);
  });
}

startServer();
