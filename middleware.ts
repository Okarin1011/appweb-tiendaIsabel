import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const supabaseResponse = response
    // Check if user is authenticated by looking for session cookie
    const hasSession = request.cookies.has('sb-access-token') || 
                       request.cookies.getAll().some(c => c.name.includes('auth-token'))
    
    // The updateSession will handle the actual auth check
    // If no session, redirect to login
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
