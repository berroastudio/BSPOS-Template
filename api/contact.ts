import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { name, email, subject, message, turnstileToken } = await req.json();

    // 1. Validar Cloudflare Turnstile
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
      return new Response(JSON.stringify({ success: false, message: 'Fallo al verificar seguridad (Turnstile).' }), { status: 400 });
    }

    // 2. Conexión a Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Guardar Mensaje
    const { data: contactData, error: contactError } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        subject,
        message,
        status: 'new',
        created_at: new Date().toISOString()
      }).select().single();

    if (contactError) {
      return new Response(JSON.stringify({ success: false, message: 'Error al guardar en BD' }), { status: 500 });
    }

    // 4. Crear Notificación
    const rdTenantId = '49dbf962-1e06-4af8-a2be-39d4c897c87e';
    await supabase.from('notifications').insert({
      title: 'Nuevo Mensaje Web',
      message: `Mensaje de ${name}: ${subject}`,
      type: 'info',
      is_read: false,
      tenant_id: rdTenantId,
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, message: 'Enviado correctamente', id: contactData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
