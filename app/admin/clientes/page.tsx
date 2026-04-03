import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Users } from 'lucide-react'
import { CustomersTable } from '@/components/admin/customers-table'

async function getCustomers() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      credits (id, current_balance, status)
    `)
    .order('name')

  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  return data || []
}

export default async function CustomersPage() {
  const customers = await getCustomers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestiona tu base de clientes</p>
        </div>
        <Link href="/admin/clientes/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay clientes</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza agregando tu primer cliente
            </p>
            <Link href="/admin/clientes/nuevo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Cliente
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <CustomersTable customers={customers} />
      )}
    </div>
  )
}
