'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { CustomerInsert, CustomerUpdate } from '@/lib/types/database'

// =============================================
// CLIENTES
// =============================================

export async function getCustomers() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getActiveCustomers() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .order('first_name', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function getCustomerById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getCustomerByDocument(documentNumber: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('document_number', documentNumber)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data
}

export async function searchCustomers(query: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,document_number.ilike.%${query}%`)
    .eq('is_active', true)
    .order('first_name', { ascending: true })
    .limit(10)

  if (error) throw new Error(error.message)
  return data
}

export async function createCustomer(customer: CustomerInsert) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('customers', 'max')
  return data
}

export async function updateCustomer(id: string, customer: CustomerUpdate) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .update(customer)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('customers', 'max')
  return data
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient()

  // Soft delete - just mark as inactive
  const { error } = await supabase
    .from('customers')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidateTag('customers', 'max')
  return true
}

export async function getCustomerWithCredits(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      credits(
        id,
        total_amount,
        amount_paid,
        balance,
        status,
        due_date,
        created_at
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getCustomersWithActiveCredits() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      credits!inner(
        id,
        total_amount,
        amount_paid,
        balance,
        status,
        due_date
      )
    `)
    .in('credits.status', ['pendiente', 'aprobado'])
    .eq('is_active', true)
    .order('first_name', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function updateCustomerCreditLimit(id: string, creditLimit: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .update({ credit_limit: creditLimit })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('customers', 'max')
  return data
}
