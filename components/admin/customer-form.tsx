'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createCustomer, updateCustomer } from '@/lib/actions/customers'
import { toast } from 'sonner'

interface CustomerFormProps {
  customer?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    notes: string | null
  }
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter()
  const isEditing = !!customer

  const [name, setName] = useState(customer?.name || '')
  const [email, setEmail] = useState(customer?.email || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [address, setAddress] = useState(customer?.address || '')
  const [notes, setNotes] = useState(customer?.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setIsSubmitting(true)

    try {
      const customerData = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      }

      let result
      if (isEditing) {
        result = await updateCustomer(customer.id, customerData)
      } else {
        result = await createCustomer(customerData)
      }

      if (result.success) {
        toast.success(isEditing ? 'Cliente actualizado' : 'Cliente creado')
        router.push('/admin/clientes')
        router.refresh()
      } else {
        toast.error(result.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar el cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Informacion del Cliente</CardTitle>
          <CardDescription>Datos de contacto y notas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              required
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Direccion</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Direccion completa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales sobre el cliente..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Cliente'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
