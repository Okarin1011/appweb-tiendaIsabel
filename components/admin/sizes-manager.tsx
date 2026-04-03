'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Ruler } from 'lucide-react'
import { createSize, updateSize, deleteSize } from '@/lib/actions/products'
import { toast } from 'sonner'

interface Size {
  id: string
  name: string
  display_order: number
}

interface SizesManagerProps {
  initialSizes: Size[]
}

export function SizesManager({ initialSizes }: SizesManagerProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)
  const [name, setName] = useState('')
  const [displayOrder, setDisplayOrder] = useState('0')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setName('')
    setDisplayOrder(String(initialSizes.length))
    setEditingSize(null)
  }

  const openCreate = () => {
    resetForm()
    setIsOpen(true)
  }

  const openEdit = (size: Size) => {
    setEditingSize(size)
    setName(size.name)
    setDisplayOrder(String(size.display_order))
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      if (editingSize) {
        const result = await updateSize(editingSize.id, { name: name.trim(), display_order: Number(displayOrder) })
        if (result.success) {
          toast.success('Talla actualizada')
          router.refresh()
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createSize({ name: name.trim(), display_order: Number(displayOrder) })
        if (result.success) {
          toast.success('Talla creada')
          router.refresh()
        } else {
          toast.error(result.error)
        }
      }
      setIsOpen(false)
      resetForm()
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta talla?')) return
    
    const result = await deleteSize(id)
    if (result.success) {
      toast.success('Talla eliminada')
      router.refresh()
    } else {
      toast.error(result.error || 'Error al eliminar')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Tallas
            </CardTitle>
            <CardDescription>Define las tallas disponibles</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSize ? 'Editar' : 'Nueva'} Talla</DialogTitle>
                <DialogDescription>
                  {editingSize ? 'Modifica los datos de la talla' : 'Agrega una nueva talla'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="size-name">Nombre</Label>
                  <Input
                    id="size-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: M, L, XL, 32, 34..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size-order">Orden</Label>
                  <Input
                    id="size-order"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {initialSizes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay tallas creadas
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {initialSizes.map((size) => (
              <div
                key={size.id}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <span className="font-medium">{size.name}</span>
                <div className="hidden group-hover:flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(size)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(size.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
