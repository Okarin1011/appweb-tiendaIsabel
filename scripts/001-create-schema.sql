-- =============================================
-- ESQUEMA DE BASE DE DATOS PARA TIENDA DE ROPA
-- Supabase PostgreSQL
-- =============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUM TYPES
-- =============================================

-- Estados de crédito
CREATE TYPE credit_status AS ENUM ('pendiente', 'aprobado', 'negado', 'pagado', 'vencido');

-- Tipos de venta
CREATE TYPE sale_type AS ENUM ('contado', 'credito');

-- Estados de producto
CREATE TYPE product_status AS ENUM ('activo', 'inactivo', 'agotado');

-- Tipos de movimiento de crédito
CREATE TYPE movement_type AS ENUM ('pago', 'adelanto', 'cancelacion', 'ajuste');

-- =============================================
-- TABLA: categories (Categorías de productos)
-- =============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: products (Productos)
-- =============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10, 2) CHECK (compare_at_price >= 0),
  cost_price DECIMAL(10, 2) CHECK (cost_price >= 0),
  sku VARCHAR(100),
  barcode VARCHAR(100),
  status product_status DEFAULT 'activo',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: product_images (Imágenes de productos)
-- =============================================
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: sizes (Tallas disponibles)
-- =============================================
CREATE TABLE sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(20) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0
);

-- Insertar tallas comunes
INSERT INTO sizes (name, display_order) VALUES
  ('XS', 1),
  ('S', 2),
  ('M', 3),
  ('L', 4),
  ('XL', 5),
  ('XXL', 6),
  ('XXXL', 7),
  ('28', 10),
  ('30', 11),
  ('32', 12),
  ('34', 13),
  ('36', 14),
  ('38', 15),
  ('40', 16),
  ('42', 17),
  ('Único', 100);

-- =============================================
-- TABLA: product_variants (Variantes de producto - Talla/Stock)
-- =============================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_id UUID NOT NULL REFERENCES sizes(id) ON DELETE RESTRICT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku_variant VARCHAR(100),
  price_adjustment DECIMAL(10, 2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, size_id)
);

-- =============================================
-- TABLA: customers (Clientes)
-- =============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  document_type VARCHAR(20) DEFAULT 'cedula',
  document_number VARCHAR(50) UNIQUE,
  address TEXT,
  city VARCHAR(100),
  notes TEXT,
  credit_limit DECIMAL(10, 2) DEFAULT 0 CHECK (credit_limit >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: sales (Ventas)
-- =============================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  sale_type sale_type NOT NULL DEFAULT 'contado',
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount DECIMAL(10, 2) DEFAULT 0 CHECK (discount >= 0),
  tax DECIMAL(10, 2) DEFAULT 0 CHECK (tax >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  amount_paid DECIMAL(10, 2) DEFAULT 0 CHECK (amount_paid >= 0),
  notes TEXT,
  sold_by UUID, -- Referencia al usuario admin que realizó la venta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: sale_items (Items de venta)
-- =============================================
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL, -- Snapshot del nombre
  size_name VARCHAR(20), -- Snapshot de la talla
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  discount DECIMAL(10, 2) DEFAULT 0 CHECK (discount >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: credits (Créditos)
-- =============================================
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount > 0),
  amount_paid DECIMAL(10, 2) DEFAULT 0 CHECK (amount_paid >= 0),
  balance DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  installments INTEGER DEFAULT 1 CHECK (installments >= 1),
  installment_amount DECIMAL(10, 2),
  status credit_status DEFAULT 'pendiente',
  due_date DATE,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: credit_movements (Movimientos de crédito)
-- =============================================
CREATE TABLE credit_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_id UUID NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  movement_type movement_type NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  processed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: store_settings (Configuración de la tienda)
-- =============================================
CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name VARCHAR(255) NOT NULL DEFAULT 'Mi Tienda',
  slogan TEXT,
  description TEXT,
  logo_url TEXT,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  currency VARCHAR(10) DEFAULT 'COP',
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración por defecto
INSERT INTO store_settings (store_name, slogan, whatsapp) 
VALUES ('Elegance Store', 'Estilo que define tu esencia', '+57');

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

-- Productos
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;

-- Variantes
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_available ON product_variants(is_available) WHERE is_available = true;

-- Clientes
CREATE INDEX idx_customers_document ON customers(document_number);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_active ON customers(is_active) WHERE is_active = true;

-- Ventas
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_type ON sales(sale_type);
CREATE INDEX idx_sales_date ON sales(created_at);

-- Créditos
CREATE INDEX idx_credits_customer ON credits(customer_id);
CREATE INDEX idx_credits_status ON credits(status);
CREATE INDEX idx_credits_due_date ON credits(due_date);

-- Movimientos
CREATE INDEX idx_movements_credit ON credit_movements(credit_id);
CREATE INDEX idx_movements_date ON credit_movements(created_at);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar el stock después de una venta
CREATE OR REPLACE FUNCTION update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_variant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_after_sale
  AFTER INSERT ON sale_items
  FOR EACH ROW EXECUTE FUNCTION update_stock_after_sale();

-- Función para actualizar amount_paid en credits después de un movimiento
CREATE OR REPLACE FUNCTION update_credit_amount_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type IN ('pago', 'adelanto') THEN
    UPDATE credits
    SET amount_paid = amount_paid + NEW.amount
    WHERE id = NEW.credit_id;
  ELSIF NEW.movement_type = 'cancelacion' THEN
    UPDATE credits
    SET status = 'pagado',
        amount_paid = total_amount
    WHERE id = NEW.credit_id;
  END IF;
  
  -- Actualizar estado a pagado si el balance es 0
  UPDATE credits
  SET status = 'pagado'
  WHERE id = NEW.credit_id AND balance <= 0 AND status != 'pagado';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_credit_amount
  AFTER INSERT ON credit_movements
  FOR EACH ROW EXECUTE FUNCTION update_credit_amount_paid();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública (catálogo)
CREATE POLICY "Categorías visibles públicamente" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Productos activos visibles públicamente" ON products
  FOR SELECT USING (status = 'activo');

CREATE POLICY "Imágenes de productos visibles públicamente" ON product_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_images.product_id 
      AND products.status = 'activo'
    )
  );

CREATE POLICY "Variantes de productos activos visibles" ON product_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_variants.product_id 
      AND products.status = 'activo'
    )
  );

CREATE POLICY "Configuración de tienda visible públicamente" ON store_settings
  FOR SELECT USING (true);

-- Políticas para usuarios autenticados (admin)
CREATE POLICY "Admin: CRUD completo en categorías" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin: CRUD completo en productos" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin: CRUD completo en imágenes" ON product_images
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin: CRUD completo en variantes" ON product_variants
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin: CRUD completo en clientes" ON customers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin: CRUD completo en ventas" ON sales
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin: CRUD completo en items de venta" ON sale_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin: CRUD completo en créditos" ON credits
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin: CRUD completo en movimientos" ON credit_movements
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin: CRUD completo en configuración" ON store_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista de productos con información completa
CREATE OR REPLACE VIEW products_with_details AS
SELECT 
  p.*,
  c.name as category_name,
  c.slug as category_slug,
  (
    SELECT image_url 
    FROM product_images pi 
    WHERE pi.product_id = p.id 
    ORDER BY pi.is_primary DESC, pi.display_order ASC 
    LIMIT 1
  ) as primary_image,
  (
    SELECT COALESCE(SUM(pv.stock), 0) 
    FROM product_variants pv 
    WHERE pv.product_id = p.id
  ) as total_stock,
  (
    SELECT json_agg(
      json_build_object(
        'id', pv.id,
        'size_id', pv.size_id,
        'size_name', s.name,
        'stock', pv.stock,
        'is_available', pv.is_available
      ) ORDER BY s.display_order
    )
    FROM product_variants pv
    JOIN sizes s ON s.id = pv.size_id
    WHERE pv.product_id = p.id
  ) as variants
FROM products p
LEFT JOIN categories c ON c.id = p.category_id;

-- Vista de créditos activos con información del cliente
CREATE OR REPLACE VIEW active_credits_view AS
SELECT 
  cr.*,
  cu.first_name || ' ' || cu.last_name as customer_name,
  cu.phone as customer_phone,
  cu.whatsapp as customer_whatsapp,
  s.total as sale_total,
  s.created_at as sale_date
FROM credits cr
JOIN customers cu ON cu.id = cr.customer_id
JOIN sales s ON s.id = cr.sale_id
WHERE cr.status IN ('pendiente', 'aprobado');

-- Vista de resumen de ventas por período
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
  DATE_TRUNC('day', created_at) as sale_date,
  sale_type,
  COUNT(*) as total_sales,
  SUM(total) as total_amount,
  SUM(discount) as total_discounts
FROM sales
GROUP BY DATE_TRUNC('day', created_at), sale_type
ORDER BY sale_date DESC;
