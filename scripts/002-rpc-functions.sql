-- =============================================
-- FUNCIONES RPC PARA LA TIENDA
-- =============================================

-- Función para restaurar stock (cuando se cancela una venta)
CREATE OR REPLACE FUNCTION restore_stock(variant_id UUID, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET stock = stock + quantity
  WHERE id = variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el dashboard KPIs
CREATE OR REPLACE FUNCTION get_dashboard_kpis(start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days', end_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_sales', (SELECT COUNT(*) FROM sales WHERE created_at::date BETWEEN start_date AND end_date),
    'total_sales_amount', (SELECT COALESCE(SUM(total), 0) FROM sales WHERE created_at::date BETWEEN start_date AND end_date),
    'cash_sales', (SELECT COUNT(*) FROM sales WHERE sale_type = 'contado' AND created_at::date BETWEEN start_date AND end_date),
    'cash_sales_amount', (SELECT COALESCE(SUM(total), 0) FROM sales WHERE sale_type = 'contado' AND created_at::date BETWEEN start_date AND end_date),
    'credit_sales', (SELECT COUNT(*) FROM sales WHERE sale_type = 'credito' AND created_at::date BETWEEN start_date AND end_date),
    'credit_sales_amount', (SELECT COALESCE(SUM(total), 0) FROM sales WHERE sale_type = 'credito' AND created_at::date BETWEEN start_date AND end_date),
    'active_credits', (SELECT COUNT(*) FROM credits WHERE status IN ('pendiente', 'aprobado')),
    'active_credits_amount', (SELECT COALESCE(SUM(balance), 0) FROM credits WHERE status IN ('pendiente', 'aprobado')),
    'pending_payments', (SELECT COALESCE(SUM(balance), 0) FROM credits WHERE status IN ('pendiente', 'aprobado')),
    'low_stock_products', (SELECT COUNT(DISTINCT product_id) FROM product_variants WHERE stock <= 3 AND is_available = true)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para buscar productos
CREATE OR REPLACE FUNCTION search_products(search_query TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  price DECIMAL,
  status product_status,
  category_name VARCHAR,
  primary_image TEXT,
  total_stock BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.price,
    p.status,
    c.name as category_name,
    (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC LIMIT 1) as primary_image,
    (SELECT COALESCE(SUM(pv.stock), 0) FROM product_variants pv WHERE pv.product_id = p.id) as total_stock
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE 
    p.name ILIKE '%' || search_query || '%' OR
    p.sku ILIKE '%' || search_query || '%' OR
    p.barcode ILIKE '%' || search_query || '%' OR
    c.name ILIKE '%' || search_query || '%'
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener productos con bajo stock
CREATE OR REPLACE FUNCTION get_low_stock_products(threshold INTEGER DEFAULT 5)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  size_name VARCHAR,
  stock INTEGER,
  variant_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    s.name as size_name,
    pv.stock,
    pv.id as variant_id
  FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  JOIN sizes s ON s.id = pv.size_id
  WHERE pv.stock <= threshold AND pv.is_available = true
  ORDER BY pv.stock ASC, p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
