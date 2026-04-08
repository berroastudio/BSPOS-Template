import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
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
  const PORT = 4000; // Cambiado a 4000 para mayor claridad

  app.use(express.json());

  // Middleware para CSP headers (desarrollo)
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.clerk.accounts.dev https://clerk.berroastudio.com https://ecommerce.berroastudio.com https://embed.tawk.to https://*.tawk.to; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.clerk.accounts.dev https://ecommerce.berroastudio.com https://clerk.berroastudio.com wss://clerk.berroastudio.com https://fonts.googleapis.com https://fonts.gstatic.com https://*.tawk.to wss://*.tawk.to; img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://*.stripe.com https://*.gstatic.com https://*.google.com https://raw.githubusercontent.com https://*.tawk.to; font-src 'self' data: https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://embed.tawk.to https://*.tawk.to; frame-src 'self' https://js.stripe.com https://embed.tawk.to https://*.tawk.to; worker-src 'self' blob:;"
    );
    next();
  });

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

      console.log(`[Promo] Validating: ${code} for ${subtotal} ${currency}`);

      const supabase = getSupabaseAdmin();
      const { data: promo, error } = await supabase
        .from('promotions')
        .select('*')
        .ilike('code', code)
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

      // Validar compra mínima según moneda (fallback a min_purchase genérico si no existe el campo específico)
      const minKey = `min_purchase_${currency.toLowerCase()}`;
      const minPurchase = Number(promo[minKey] ?? promo.min_purchase ?? 0);
      
      console.log(`[Promo] Min purchase: ${minPurchase}, Applied to subtotal: ${subtotal}`);

      if (subtotal < minPurchase) {
        return res.json({ 
          valid: false, 
          message: `Compra mínima requerida: ${currency} ${minPurchase.toFixed(2)}` 
        });
      }

      // Calcular descuento (ahora con parseFloat para seguridad)
      const pValue = parseFloat(promo.value);
      let discountAmount = 0;
      if (promo.type === 'percentage') {
        discountAmount = (subtotal * pValue) / 100;
      } else if (promo.type === 'fixed_amount') {
        discountAmount = pValue;
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

  // Endpoint de Contacto
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message, turnstileToken } = req.body;

      // Cloudflare Turnstile Validation
      if (!turnstileToken) {
        return res.status(400).json({ success: false, message: 'Verificación de seguridad requerida' });
      }

      const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: turnstileToken
        }).toString()
      });

      const turnstileData = await turnstileRes.json();
      if (!turnstileData.success) {
        return res.status(400).json({ success: false, message: 'Fallo al verificar que eres humano.' });
      }

      // Validación básica
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ 
          success: false, 
          message: 'Todos los campos son requeridos' 
        });
      }

      // Validación de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email inválido' 
        });
      }

      const supabase = getSupabaseAdmin();

      // Guardar el mensaje de contacto en Supabase
      const { data, error } = await supabase
        .from('contact_messages')
        .insert({
          name,
          email,
          subject,
          message,
          status: 'new',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('[Contact Error]:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error al guardar el mensaje' 
        });
      }

      // Aquí puedes agregar envío de email usando un servicio como SendGrid, Resend, etc.
      // Por ahora solo guardamos en la base de datos
      console.log(`[Contact] Nuevo mensaje de ${name} (${email}): ${subject}`);

      res.json({ 
        success: true, 
        message: 'Mensaje enviado exitosamente',
        data 
      });

    } catch (error: any) {
      console.error('Error en contacto:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  });

  // ==========================================
  // VITE MIDDLEWARE (Frontend)
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    // Configurar Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Usamos custom para manejar el index.html manualmente
    });
    
    app.use(vite.middlewares);

    // Catch-all para servir index.html (SPA)
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        console.error('[Vite Middleware Error]:', e);
        next(e);
      }
    });

  } else {
    // Modo producción: Servir archivos estáticos de dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Solo iniciar el listener si no estamos en Vercel (que usa el export)
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 Storefront running on http://localhost:${PORT}`);
      console.log(`📦 Serving files from ${process.cwd()}\n`);
    });
  }
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

export default startServer; // Exportar para Vercel
