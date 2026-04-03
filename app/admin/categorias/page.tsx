import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tags } from 'lucide-react'
import { CategoriesManager } from '@/components/admin/categories-manager'
import { SizesManager } from '@/components/admin/sizes-manager'

async function getData() {
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

export default async function CategoriesPage() {
  const { categories, sizes } = await getData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categorias y Tallas</h1>
        <p className="text-muted-foreground">Gestiona las categorias y tallas de productos</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoriesManager initialCategories={categories} />
        <SizesManager initialSizes={sizes} />
      </div>
    </div>
  )
}
