-- =============================================
-- FIX: Políticas RLS faltantes para tabla sizes
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Habilitar RLS en sizes (si no estaba activado)
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;

-- Lectura pública: cualquiera puede ver las tallas
CREATE POLICY "Tallas visibles públicamente" ON sizes
  FOR SELECT USING (true);

-- Admin: CRUD completo en tallas
CREATE POLICY "Admin: CRUD completo en tallas" ON sizes
  FOR ALL USING (auth.role() = 'authenticated');
