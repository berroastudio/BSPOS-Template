import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { code, subtotal, currency } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ valid: false, message: 'Código requerido' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data: promo, error } = await supabase
      .from('promotions')
      .select('*')
      .ilike('code', code)
      .eq('status', 'active')
      .single();

    if (error || !promo) {
      return new Response(JSON.stringify({ valid: false, message: 'Código no válido o expirado' }), { status: 200 });
    }

    // Calcular descuento
    const pValue = parseFloat(promo.value);
    let discountAmount = 0;
    if (promo.type === 'percentage') {
      discountAmount = (subtotal * pValue) / 100;
    } else {
      discountAmount = pValue;
    }

    return new Response(JSON.stringify({
      valid: true,
      message: 'Código aplicado',
      discountAmount,
      promoId: promo.id,
      type: promo.type
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
