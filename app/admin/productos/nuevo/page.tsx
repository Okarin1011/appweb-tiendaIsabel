import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { ProductForm } from '@/components/admin/product-form'

async function getFormData() {
  const supabase = await createClient()
  
  const [categoriesRes, sizesRes] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('sizes').select('*').order('display_order'),
  ])

  return {
    categories: categoriesRes.data || [],
    sizes: sizesRes.data || [],
  }
}

export default async function NewProductPage() {
  const { categories, sizes } = await getFormData()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/productos">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Producto</h1>
          <p className="text-muted-foreground">Agrega un nuevo producto al inventario</p>
        </div>
      </div>

      <ProductForm categories={categories} sizes={sizes} />
    </div>
  )
}
