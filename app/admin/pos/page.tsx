import { createClient } from '@/lib/supabase/server'
import { POSSystem } from '@/components/admin/pos-system'

async function getData() {
  const supabase = await createClient()
  
  const [productsRes, customersRes, settingsRes] = await Promise.all([
    supabase
      .from('products')
      .select(`
        *,
        categories (id, name),
        product_images (id, url, is_primary),
        product_variants (id, stock, price, size_id, sizes (id, name))
      `)
      .eq('status', 'active')
      .order('name'),
    supabase.from('customers').select('*').order('name'),
    supabase.from('store_settings').select('*').single(),
  ])

  return {
    products: productsRes.data || [],
    customers: customersRes.data || [],
    settings: settingsRes.data,
  }
}

export default async function POSPage() {
  const { products, customers, settings } = await getData()

  return (
    <div className="h-[calc(100vh-8rem)]">
      <POSSystem products={products} customers={customers} settings={settings} />
    </div>
  )
}
