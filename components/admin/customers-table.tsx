'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { MoreHorizontal, Edit, Trash2, Search, CreditCard, Phone, Mail } from 'lucide-react'
import { deleteCustomer } from '@/lib/actions/customers'
import { toast } from 'sonner'

interface Credit {
  id: string
  current_balance: number
  status: string
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  credits: Credit[]
}

interface CustomersTableProps {
  customers: Customer[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = search.toLowerCase()
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(search)
    )
  })

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estas seguro de eliminar este cliente?')) return
    
    const result = await deleteCustomer(id)
    if (result.success) {
      toast.success('Cliente eliminado')
      router.refresh()
    } else {
      toast.error(result.error || 'Error al eliminar')
    }
  }

  const getActiveCredit = (credits: Credit[]) => {
    return credits.find(c => c.status === 'active')
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o telefono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Credito Activo</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => {
                  const activeCredit = getActiveCredit(customer.credits)
                  
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          {customer.address && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {customer.address}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activeCredit ? (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <span className="font-medium">
                              {formatCurrency(activeCredit.current_balance)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin credito</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/clientes/${customer.id}/editar`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(customer.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
