'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { CategoryInsert, CategoryUpdate } from '@/lib/types/database'

// =============================================
// CATEGORÍAS
// =============================================

export async function getCategories() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function getActiveCategories() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getCategoryById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createCategory(category: Omit<CategoryInsert, 'slug'>) {
  const supabase = await createClient()

  // Create slug from name
  const slug = category.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...category, slug })
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('categories', 'max')
  return data
}

export async function updateCategory(id: string, category: CategoryUpdate) {
  const supabase = await createClient()

  // Update slug if name changed
  let updates = { ...category }
  if (category.name) {
    updates.slug = category.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('categories', 'max')
  return data
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidateTag('categories', 'max')
  return true
}

export async function toggleCategoryActive(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('categories', 'max')
  return data
}

export async function reorderCategories(categoryIds: string[]) {
  const supabase = await createClient()

  // Update each category's display_order
  const updates = categoryIds.map((id, index) => 
    supabase
      .from('categories')
      .update({ display_order: index })
      .eq('id', id)
  )

  await Promise.all(updates)
  
  revalidateTag('categories', 'max')
  return true
}
