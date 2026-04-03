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
import { Plus, Edit, Trash2, Tags } from 'lucide-react'
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/categories'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  description: string | null
}

interface CategoriesManagerProps {
  initialCategories: Category[]
}

export function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [isOpen, setIsOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setName('')
    setDescription('')
    setEditingCategory(null)
  }

  const openCreate = () => {
    resetForm()
    setIsOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditingCategory(category)
    setName(category.name)
    setDescription(category.description || '')
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      if (editingCategory) {
        const result = await updateCategory(editingCategory.id, { name: name.trim(), description: description.trim() || null })
        if (result.success) {
          toast.success('Categoria actualizada')
          router.refresh()
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createCategory({ name: name.trim(), description: description.trim() || null })
        if (result.success) {
          toast.success('Categoria creada')
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
    if (!confirm('¿Eliminar esta categoria?')) return
    
    const result = await deleteCategory(id)
    if (result.success) {
      toast.success('Categoria eliminada')
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
              <Tags className="h-5 w-5" />
              Categorias
            </CardTitle>
            <CardDescription>Organiza tus productos por categoria</CardDescription>
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
                <DialogTitle>{editingCategory ? 'Editar' : 'Nueva'} Categoria</DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'Modifica los datos de la categoria' : 'Agrega una nueva categoria de productos'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cat-name">Nombre</Label>
                  <Input
                    id="cat-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Camisas"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-desc">Descripcion (opcional)</Label>
                  <Input
                    id="cat-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripcion de la categoria"
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
        {initialCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay categorias creadas
          </p>
        ) : (
          <div className="space-y-2">
            {initialCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
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
