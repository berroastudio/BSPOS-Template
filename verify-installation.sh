#!/bin/bash
# Script para verificar que todas las nuevas funcionalidades están correctamente instaladas

echo "🔍 Verificando instalación de nuevas funcionalidades..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (NO ENCONTRADO)"
        return 1
    fi
}

echo "📦 Verificando componentes nuevos:"
check_file "src/components/CookieBanner.tsx"
check_file "src/pages/ContactPage.tsx"
check_file "src/pages/PrivacyPage.tsx"

echo ""
echo "📁 Verificando migraciones SQL:"
check_file "sql_migrations/001_create_contact_messages.sql"

echo ""
echo "📚 Verificando documentación:"
check_file "NUEVAS_FUNCIONALIDADES.md"
check_file "CAMBIOS_REALIZADOS.md"

echo ""
echo "✅ Instalación verificada!"
echo ""
echo "🚀 Próximos pasos:"
echo "1. Ejecuta el SQL de sql_migrations/001_create_contact_messages.sql en tu Supabase"
echo "2. Personaliza los textos en src/pages/ContactPage.tsx y src/pages/PrivacyPage.tsx"
echo "3. (Opcional) Integra un servicio de email para notificaciones"
echo "4. Deploy a Vercel: git push"
echo ""
echo "📖 Lee NUEVAS_FUNCIONALIDADES.md para más detalles"
