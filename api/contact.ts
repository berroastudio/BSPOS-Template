import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: 'edge',
};

// Map region to Tenant IDs
const TENANT_MAP: Record<string, string> = {
  'RD': '49dbf962-1e06-4af8-a2be-39d4c897c87e', // Berroa Studio RD
  'USA': 'b0f9c2d1-0e9a-4d3c-9b8a-7e6f5d4c3b2a', // Provisional USA ID (User should verify)
  'GLOBAL': '49dbf962-1e06-4af8-a2be-39d4c897c87e'
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { name, email, subject, message, turnstileToken, region = 'RD' } = body;

    // 1. Validate Cloudflare Turnstile
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
    
    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: turnstileToken || '',
      }).toString()
    });

    const turnstileData = await turnstileRes.json();
    if (!turnstileData.success) {
      console.error("[Contact API] Turnstile verify failed:", turnstileData);
      return new Response(JSON.stringify({ success: false, message: 'Fallo al verificar seguridad (Turnstile).' }), { status: 400 });
    }

    // 2. Supabase Connection
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const tenantId = TENANT_MAP[region.toUpperCase()] || TENANT_MAP['GLOBAL'];

    // 3. Save Message
    const { data: contactData, error: contactError } = await supabase
      .from('contact_messages')
      .insert({
        tenant_id: tenantId,
        name,
        email,
        subject,
        message,
        status: 'new'
      }).select().single();

    if (contactError) {
      console.error("[Contact API] DB Insert Error:", contactError);
      return new Response(JSON.stringify({ success: false, message: 'Error al guardar mensaje en base de datos.' }), { status: 500 });
    }

    // 4. Create ERP Notification
    // Included erp_category for compatibility with the new ERP system
    await supabase.from('notifications').insert({
      tenant_id: tenantId,
      title: 'Nuevo Mensaje Web',
      message: `Enviado por ${name}: ${subject}`,
      type: 'info',
      is_read: false,
      erp_category: 'marketing'
    });

    return new Response(JSON.stringify({ success: true, message: 'Enviado correctamente', id: contactData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error("[Contact API] Fatal Error:", err);
    return new Response(JSON.stringify({ error: 'Server error: ' + err.message }), { status: 500 });
  }
}
