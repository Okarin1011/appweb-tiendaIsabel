import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, Edit, Eye } from 'lucide-react'
import { ProductsTable } from '@/components/admin/products-table'

async function getProducts() {
  const supabase = await createClient()
  
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (id, name),
      product_images (id, url, is_primary),
      product_variants (id, stock, price, sizes (id, name))
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return products || []
}

async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('name')
  return data || []
}

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">Gestiona el inventario de tu tienda</p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza agregando tu primer producto al inventario
            </p>
            <Link href="/admin/productos/nuevo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ProductsTable products={products} categories={categories} />
      )}
    </div>
  )
}
