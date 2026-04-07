# Nuevas Funcionalidades: Cookie Banner y Página de Contacto

## 📋 Resumen

Se han agregado dos nuevas funcionalidades a tu storefront:

1. **Cookie Banner / GDPR** - Aviso de cookies personalizable que se muestra al usuario
2. **Página de Contacto** - Formulario de contacto completo con validación

Ambos usan tu UI existente y están completamente integrados con tu diseño.

---

## 🍪 Cookie Banner

### Ubicación
- Componente: `src/components/CookieBanner.tsx`
- Estilos: `src/index.css` (sección `/* COOKIE BANNER */`)

### Características
- Se muestra automáticamente si el usuario no ha dado consentimiento
- Permite aceptar todo, rechazar o personalizar preferencias
- Guarda las preferencias en `localStorage` con clave `bs-cookie-consent`
- Estructura de consentimiento:
  ```json
  {
    "analytics": boolean,
    "marketing": boolean,
    "functional": true,  // Siempre necesario
    "timestamp": "2026-04-07T..."
  }
  ```

### Personalización
En `CookieBanner.tsx` puedes cambiar:
- Textos y descripciones
- Tipos de cookies (actualmente: funcionales, analíticas, marketing)
- Comportamiento y tiempos

### Próximos pasos
1. Integra Google Analytics o Segment para usar las preferencias de `analytics`
2. Integra Facebook Pixel o similares para `marketing`
3. Lee las preferencias en tu código para habilitar/deshabilitar servicios

---

## 📧 Página de Contacto

### Ubicación
- Componente: `src/pages/ContactPage.tsx`
- Estilos: `src/index.css` (sección `/* CONTACT PAGE */`)
- Ruta: `/contact`

### Características
- Formulario con campos: Nombre, Email, Asunto, Mensaje
- Validación de email
- Indicador de envío (loading state)
- Mensajes de éxito/error
- Información de contacto con iconos (Email, Teléfono, Ubicación)
- Completamente responsive

### Cambios Realizados
1. **App.tsx**: Agregada ruta `/contact` y `/privacy`
2. **StorefrontPage.tsx**: Agregado enlace "Contacto" en la nav
3. **server.ts**: Agregado endpoint `POST /api/contact`
4. **Supabase**: Se agregó tabla `contact_messages` (ver abajo)

---

## 🔧 Configuración en Supabase

### Crear la tabla `contact_messages`

Ejecuta el SQL en tu Supabase SQL Editor:

```sql
-- Tabla para almacenar mensajes de contacto
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Política para insertar (público)
CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Índices
CREATE INDEX idx_contact_messages_email ON public.contact_messages(email);
CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

-- Trigger para updated_at
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
```

**Archivo SQL completo disponible en**: `sql_migrations/001_create_contact_messages.sql`

---

## 📱 Página de Privacidad

### Ubicación
- Componente: `src/pages/PrivacyPage.tsx`
- Ruta: `/privacy`
- Enlazada desde el Cookie Banner

### Características
- Política de privacidad completa en español
- 8 secciones principales
- Completamente personalizable
- Muestra fecha de última actualización automáticamente

### Personalización
Abre `src/pages/PrivacyPage.tsx` y modifica:
- Textos según tu política actual
- Email de contacto
- Ubicación
- Horarios de atención

---

## 🔌 Integración de Email (Próximo Paso)

Para enviar notificaciones por email cuando se reciba un mensaje de contacto:

### Opción 1: SendGrid
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
await sgMail.send({
  to: process.env.CONTACT_EMAIL!,
  from: 'noreply@berroastudio.com',
  subject: `Nuevo mensaje de contacto: ${subject}`,
  html: `<p>De: ${name} (${email})</p><p>${message}</p>`
});
```

### Opción 2: Resend
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: 'noreply@berroastudio.com',
  to: process.env.CONTACT_EMAIL!,
  subject: `Nuevo mensaje: ${subject}`,
  html: `<p>De: ${name} (${email})</p><p>${message}</p>`
});
```

---

## 🎨 Personalización de Estilos

Todos los estilos usan tus variables CSS existentes:
- `--bg`, `--bg2`, `--bg3`: Colores de fondo
- `--text`, `--muted`: Textos
- `--accent`, `--accent-fg`: Acentos (botones)
- `--border`: Bordes
- `--r`, `--r-sm`, `--r-lg`: Border radius
- `--shadow`, `--shadow-lg`: Sombras

Para cambiar colores globales, modifica `:root` en `index.css`.

---

## ✅ Checklist de Implementación

- [x] Cookie Banner creado
- [x] Página de Contacto creada
- [x] Página de Privacidad creada
- [x] Endpoint `/api/contact` implementado
- [x] Tabla `contact_messages` en Supabase
- [x] Rutas integradas en App.tsx
- [x] Enlace en navegación
- [x] Estilos completos y responsive
- [ ] Implementar envío de emails
- [ ] Agregar CAPTCHA (protección contra spam)
- [ ] Agregar integración con Google Analytics
- [ ] Agregar integración con Meta Pixel

---

## 🚀 Deployment

Cuando despliegues en Vercel:

1. **Agregar tabla a Supabase**: Ejecuta el SQL en tu proyecto
2. **Versión actualizada**: `git push` de los cambios
3. **Variables de entorno**: Si agregas email, configura las claves en Vercel

¡Todo está listo para usar inmediatamente!

---

## 📧 Soporte

Para cambios o mejoras, puedes modificar los archivos:
- `src/components/CookieBanner.tsx` - Cookie banner
- `src/pages/ContactPage.tsx` - Página de contacto
- `src/pages/PrivacyPage.tsx` - Política de privacidad
- `src/index.css` - Estilos (busca `/* COOKIE BANNER */` y `/* CONTACT PAGE */`)
