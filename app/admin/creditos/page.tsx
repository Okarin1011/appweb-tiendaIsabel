import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, DollarSign, AlertCircle, CheckCircle } from 'lucide-react'
import { CreditsTable } from '@/components/admin/credits-table'

async function getCreditsData() {
  const supabase = await createClient()
  
  const { data: credits, error } = await supabase
    .from('credits')
    .select(`
      *,
      customers (id, name, phone, email),
      sales (id, total, created_at)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching credits:', error)
    return { credits: [], stats: { total: 0, active: 0, totalAmount: 0, overdueCount: 0 } }
  }

  const activeCredits = credits?.filter(c => c.status === 'active') || []
  const totalAmount = activeCredits.reduce((sum, c) => sum + Number(c.current_balance), 0)
  const overdueCount = activeCredits.filter(c => {
    if (!c.due_date) return false
    return new Date(c.due_date) < new Date()
  }).length

  return {
    credits: credits || [],
    stats: {
      total: credits?.length || 0,
      active: activeCredits.length,
      totalAmount,
      overdueCount,
    },
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export default async function CreditsPage() {
  const { credits, stats } = await getCreditsData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Creditos</h1>
        <p className="text-muted-foreground">Gestiona los creditos de tus clientes</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Creditos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Creditos Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      {credits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay creditos</h3>
            <p className="text-muted-foreground text-center">
              Los creditos se crean automaticamente al realizar ventas a credito
            </p>
          </CardContent>
        </Card>
      ) : (
        <CreditsTable credits={credits} />
      )}
    </div>
  )
}
