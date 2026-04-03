import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Package, Users, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react'

async function getDashboardData() {
  const supabase = await createClient()
  
  // Get total sales for today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: todaySales } = await supabase
    .from('sales')
    .select('total')
    .gte('created_at', today.toISOString())
    .eq('status', 'completed')

  const todayTotal = todaySales?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0

  // Get total sales for this month
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const { data: monthSales } = await supabase
    .from('sales')
    .select('total')
    .gte('created_at', firstDayOfMonth.toISOString())
    .eq('status', 'completed')

  const monthTotal = monthSales?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0

  // Get product count
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Get customer count
  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })

  // Get active credits
  const { data: activeCredits } = await supabase
    .from('credits')
    .select('current_balance')
    .eq('status', 'active')

  const totalCredits = activeCredits?.reduce((sum, credit) => sum + Number(credit.current_balance), 0) || 0
  const creditCount = activeCredits?.length || 0

  // Get low stock products
  const { data: lowStockProducts } = await supabase
    .from('product_variants')
    .select(`
      id,
      stock,
      products (name),
      sizes (name)
    `)
    .lt('stock', 5)
    .gt('stock', 0)
    .limit(5)

  // Get recent sales
  const { data: recentSales } = await supabase
    .from('sales')
    .select(`
      id,
      total,
      sale_type,
      created_at,
      customers (name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    todayTotal,
    monthTotal,
    productCount: productCount || 0,
    customerCount: customerCount || 0,
    totalCredits,
    creditCount,
    lowStockProducts: lowStockProducts || [],
    recentSales: recentSales || [],
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de tu tienda</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.todayTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Ventas del dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.monthTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Total acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.productCount}</div>
            <p className="text-xs text-muted-foreground">
              Productos activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Creditos Activos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalCredits)}</div>
            <p className="text-xs text-muted-foreground">
              {data.creditCount} creditos pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Info */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Bajo Stock
            </CardTitle>
            <CardDescription>Productos con menos de 5 unidades</CardDescription>
          </CardHeader>
          <CardContent>
            {data.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay productos con bajo stock</p>
            ) : (
              <div className="space-y-3">
                {data.lowStockProducts.map((item: { id: string; stock: number; products: { name: string } | null; sizes: { name: string } | null }) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.products?.name || 'Producto'}</p>
                      <p className="text-xs text-muted-foreground">Talla: {item.sizes?.name || '-'}</p>
                    </div>
                    <span className="text-sm font-semibold text-warning">{item.stock} uds</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ventas Recientes
            </CardTitle>
            <CardDescription>Ultimas 5 transacciones</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay ventas recientes</p>
            ) : (
              <div className="space-y-3">
                {data.recentSales.map((sale: { id: string; total: number; sale_type: string; created_at: string; customers: { name: string } | null }) => (
                  <div key={sale.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{sale.customers?.name || 'Cliente anonimo'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(sale.created_at)} - {sale.sale_type === 'cash' ? 'Efectivo' : 'Credito'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(Number(sale.total))}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
