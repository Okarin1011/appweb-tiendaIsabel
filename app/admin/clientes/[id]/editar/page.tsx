import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { CustomerForm } from '@/components/admin/customer-form'

async function getCustomer(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  return data
}

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clientes">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Cliente</h1>
          <p className="text-muted-foreground">{customer.name}</p>
        </div>
      </div>

      <CustomerForm customer={customer} />
    </div>
  )
}
