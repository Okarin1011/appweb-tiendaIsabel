// =============================================
// TIPOS DE BASE DE DATOS PARA TIENDA DE ROPA
// Generados para coincidir con el esquema de Supabase
// =============================================

// =============================================
// ENUM TYPES
// =============================================

export type CreditStatus = 'pendiente' | 'aprobado' | 'negado' | 'pagado' | 'vencido';

export type SaleType = 'contado' | 'credito';

export type ProductStatus = 'activo' | 'inactivo' | 'agotado';

export type MovementType = 'pago' | 'adelanto' | 'cancelacion' | 'ajuste';

// =============================================
// TABLE TYPES
// =============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  sku: string | null;
  barcode: string | null;
  status: ProductStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Size {
  id: string;
  name: string;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size_id: string;
  stock: number;
  sku_variant: string | null;
  price_adjustment: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  document_type: string;
  document_number: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  credit_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  customer_id: string | null;
  sale_type: SaleType;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amount_paid: number;
  notes: string | null;
  sold_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_variant_id: string | null;
  product_name: string;
  size_name: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  created_at: string;
}

export interface Credit {
  id: string;
  sale_id: string;
  customer_id: string;
  total_amount: number;
  amount_paid: number;
  balance: number; // Campo calculado (GENERATED ALWAYS AS)
  installments: number;
  installment_amount: number | null;
  status: CreditStatus;
  due_date: string | null;
  approved_at: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditMovement {
  id: string;
  credit_id: string;
  movement_type: MovementType;
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  processed_by: string | null;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  slogan: string | null;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  currency: string;
  tax_rate: number;
  created_at: string;
  updated_at: string;
}

// =============================================
// VIEW TYPES
// =============================================

export interface ProductWithDetails extends Product {
  category_name: string | null;
  category_slug: string | null;
  primary_image: string | null;
  total_stock: number;
  variants: Array<{
    id: string;
    size_id: string;
    size_name: string;
    stock: number;
    is_available: boolean;
  }> | null;
}

export interface ActiveCreditView extends Credit {
  customer_name: string;
  customer_phone: string | null;
  customer_whatsapp: string | null;
  sale_total: number;
  sale_date: string;
}

export interface SalesSummary {
  sale_date: string;
  sale_type: SaleType;
  total_sales: number;
  total_amount: number;
  total_discounts: number;
}

// =============================================
// INSERT/UPDATE TYPES (para operaciones CRUD)
// =============================================

export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'updated_at'>;
export type CategoryUpdate = Partial<CategoryInsert>;

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type ProductUpdate = Partial<ProductInsert>;

export type ProductImageInsert = Omit<ProductImage, 'id' | 'created_at'>;
export type ProductImageUpdate = Partial<ProductImageInsert>;

export type ProductVariantInsert = Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>;
export type ProductVariantUpdate = Partial<ProductVariantInsert>;

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
export type CustomerUpdate = Partial<CustomerInsert>;

export type SaleInsert = Omit<Sale, 'id' | 'created_at' | 'updated_at'>;
export type SaleUpdate = Partial<SaleInsert>;

export type SaleItemInsert = Omit<SaleItem, 'id' | 'created_at'>;

export type CreditInsert = Omit<Credit, 'id' | 'balance' | 'created_at' | 'updated_at'>;
export type CreditUpdate = Partial<Omit<CreditInsert, 'sale_id' | 'customer_id'>>;

export type CreditMovementInsert = Omit<CreditMovement, 'id' | 'created_at'>;

export type StoreSettingsUpdate = Partial<Omit<StoreSettings, 'id' | 'created_at' | 'updated_at'>>;

// =============================================
// TIPOS PARA FORMULARIOS Y UI
// =============================================

export interface ProductFormData {
  name: string;
  category_id: string;
  description: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  sku?: string;
  status: ProductStatus;
  is_featured: boolean;
  variants: Array<{
    size_id: string;
    stock: number;
  }>;
  images: Array<{
    url: string;
    is_primary: boolean;
  }>;
}

export interface CustomerFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  document_type: string;
  document_number?: string;
  address?: string;
  city?: string;
  notes?: string;
  credit_limit: number;
}

export interface SaleFormData {
  customer_id?: string;
  sale_type: SaleType;
  items: Array<{
    product_id: string;
    product_variant_id?: string;
    quantity: number;
    unit_price: number;
    discount?: number;
  }>;
  discount?: number;
  notes?: string;
}

export interface CreditFormData {
  customer_id: string;
  sale_id: string;
  total_amount: number;
  installments: number;
  due_date?: string;
  notes?: string;
}

export interface PaymentFormData {
  credit_id: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
}

// =============================================
// TIPOS PARA DASHBOARD Y REPORTES
// =============================================

export interface DashboardKPIs {
  totalSales: number;
  totalSalesAmount: number;
  cashSales: number;
  cashSalesAmount: number;
  creditSales: number;
  creditSalesAmount: number;
  activeCredits: number;
  activeCreditsAmount: number;
  pendingPayments: number;
  lowStockProducts: number;
}

export interface SalesChartData {
  date: string;
  contado: number;
  credito: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

// =============================================
// SUPABASE DATABASE TYPE DEFINITION
// =============================================

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: CategoryInsert & { id?: string };
        Update: CategoryUpdate;
      };
      products: {
        Row: Product;
        Insert: ProductInsert & { id?: string };
        Update: ProductUpdate;
      };
      product_images: {
        Row: ProductImage;
        Insert: ProductImageInsert & { id?: string };
        Update: ProductImageUpdate;
      };
      sizes: {
        Row: Size;
        Insert: Omit<Size, 'id'> & { id?: string };
        Update: Partial<Omit<Size, 'id'>>;
      };
      product_variants: {
        Row: ProductVariant;
        Insert: ProductVariantInsert & { id?: string };
        Update: ProductVariantUpdate;
      };
      customers: {
        Row: Customer;
        Insert: CustomerInsert & { id?: string };
        Update: CustomerUpdate;
      };
      sales: {
        Row: Sale;
        Insert: SaleInsert & { id?: string };
        Update: SaleUpdate;
      };
      sale_items: {
        Row: SaleItem;
        Insert: SaleItemInsert & { id?: string };
        Update: never;
      };
      credits: {
        Row: Credit;
        Insert: CreditInsert & { id?: string };
        Update: CreditUpdate;
      };
      credit_movements: {
        Row: CreditMovement;
        Insert: CreditMovementInsert & { id?: string };
        Update: never;
      };
      store_settings: {
        Row: StoreSettings;
        Insert: StoreSettingsUpdate & { id?: string };
        Update: StoreSettingsUpdate;
      };
    };
    Views: {
      products_with_details: {
        Row: ProductWithDetails;
      };
      active_credits_view: {
        Row: ActiveCreditView;
      };
      sales_summary: {
        Row: SalesSummary;
      };
    };
    Enums: {
      credit_status: CreditStatus;
      sale_type: SaleType;
      product_status: ProductStatus;
      movement_type: MovementType;
    };
  };
}
