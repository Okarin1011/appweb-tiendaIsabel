'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { ProductInsert, ProductUpdate, ProductImageInsert, ProductVariantInsert } from '@/lib/types/database'

// =============================================
// PRODUCTOS
// =============================================

export async function getProducts() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(id, image_url, alt_text, is_primary, display_order),
      variants:product_variants(id, size_id, stock, is_available, sizes(id, name, display_order))
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(id, image_url, alt_text, is_primary, display_order),
      variants:product_variants(id, size_id, stock, is_available, sizes(id, name, display_order))
    `)
    .eq('slug', slug)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getProductById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(id, image_url, alt_text, is_primary, display_order),
      variants:product_variants(id, size_id, stock, is_available, sizes(id, name, display_order))
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getFeaturedProducts() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(id, image_url, alt_text, is_primary, display_order)
    `)
    .eq('is_featured', true)
    .eq('status', 'activo')
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) throw new Error(error.message)
  return data
}

export async function getProductsByCategory(categorySlug: string) {
  const supabase = await createClient()
  
  // First get the category
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single()

  if (categoryError) throw new Error(categoryError.message)

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(id, image_url, alt_text, is_primary, display_order),
      variants:product_variants(id, size_id, stock, is_available, sizes(id, name, display_order))
    `)
    .eq('category_id', category.id)
    .eq('status', 'activo')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createProduct(
  product: ProductInsert,
  images?: Omit<ProductImageInsert, 'product_id'>[],
  variants?: Omit<ProductVariantInsert, 'product_id'>[]
) {
  const supabase = await createClient()

  // Create slug from name
  const slug = product.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  // Insert product
  const { data: newProduct, error: productError } = await supabase
    .from('products')
    .insert({ ...product, slug })
    .select()
    .single()

  if (productError) throw new Error(productError.message)

  // Insert images if provided
  if (images && images.length > 0) {
    const { error: imagesError } = await supabase
      .from('product_images')
      .insert(images.map(img => ({ ...img, product_id: newProduct.id })))

    if (imagesError) throw new Error(imagesError.message)
  }

  // Insert variants if provided
  if (variants && variants.length > 0) {
    const { error: variantsError } = await supabase
      .from('product_variants')
      .insert(variants.map(v => ({ ...v, product_id: newProduct.id })))

    if (variantsError) throw new Error(variantsError.message)
  }

  revalidateTag('products', 'max')
  return newProduct
}

export async function updateProduct(id: string, product: ProductUpdate) {
  const supabase = await createClient()

  // Update slug if name changed
  let updates = { ...product }
  if (product.name) {
    updates.slug = product.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('products', 'max')
  return data
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidateTag('products', 'max')
  return true
}

// =============================================
// VARIANTES DE PRODUCTO
// =============================================

export async function updateProductVariant(id: string, stock: number, isAvailable: boolean) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_variants')
    .update({ stock, is_available: isAvailable })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('products', 'max')
  return data
}

export async function addProductVariant(variant: ProductVariantInsert) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_variants')
    .insert(variant)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('products', 'max')
  return data
}

export async function deleteProductVariant(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidateTag('products', 'max')
  return true
}

// =============================================
// IMÁGENES DE PRODUCTO
// =============================================

export async function addProductImage(image: ProductImageInsert) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_images')
    .insert(image)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('products', 'max')
  return data
}

export async function deleteProductImage(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidateTag('products', 'max')
  return true
}

export async function setProductPrimaryImage(productId: string, imageId: string) {
  const supabase = await createClient()

  // First, set all images for this product to not primary
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)

  // Then set the selected image as primary
  const { data, error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('products', 'max')
  return data
}

// =============================================
// TALLAS
// =============================================

export async function getSizes() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sizes')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}
