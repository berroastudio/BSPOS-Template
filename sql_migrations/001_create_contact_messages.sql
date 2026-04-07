-- Tabla para almacenar mensajes de contacto
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'read', 'replied'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Política para permitir insertar mensajes (público)
CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir leer solo a usuarios autenticados (para el backoffice)
CREATE POLICY "Only authenticated users can read contact messages"
  ON public.contact_messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Index para búsquedas rápidas
CREATE INDEX idx_contact_messages_email ON public.contact_messages(email);
CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_messages_updated_at_trigger
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION update_contact_messages_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE public.contact_messages IS 'Almacena mensajes de contacto del formulario de contacto del storefront';
COMMENT ON COLUMN public.contact_messages.status IS 'Estado del mensaje: new (nuevo), read (leído), replied (respondido)';
