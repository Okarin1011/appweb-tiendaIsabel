import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { ProductForm } from '@/components/admin/product-form'

async function getProductData(id: string) {
  const supabase = await createClient()
  
  const [productRes, categoriesRes, sizesRes] = await Promise.all([
    supabase
      .from('products')
      .select(`
        *,
        product_variants (id, size_id, stock, price, sizes (id, name)),
        product_images (id, url, is_primary)
      `)
      .eq('id', id)
      .single(),
    supabase.from('categories').select('*').order('name'),
    supabase.from('sizes').select('*').order('display_order'),
  ])

  return {
    product: productRes.data,
    categories: categoriesRes.data || [],
    sizes: sizesRes.data || [],
  }
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { product, categories, sizes } = await getProductData(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/productos">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Producto</h1>
          <p className="text-muted-foreground">{product.name}</p>
        </div>
      </div>

      <ProductForm categories={categories} sizes={sizes} product={product} />
    </div>
  )
}
