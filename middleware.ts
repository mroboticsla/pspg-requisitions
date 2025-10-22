import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Verificar si el modo "Coming Soon" está habilitado
  const comingSoonEnabled = process.env.NEXT_PUBLIC_ENABLE_COMING_SOON === 'true'
  
  if (!comingSoonEnabled) {
    return NextResponse.next()
  }

  const { pathname, searchParams } = request.nextUrl
  
  // Rutas que nunca deben ser bloqueadas (API, archivos estáticos, etc.)
  const publicPaths = [
    '/coming-soon',
    '/_next',
    '/api',
    '/images',
    '/favicon.ico',
  ]
  
  // Verificar si la ruta actual debe ser excluida
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Verificar si el usuario tiene el parámetro de acceso o la cookie
  const accessParam = searchParams.get('access')
  const accessCookie = request.cookies.get('site_access')?.value
  
  // Clave de acceso (puedes cambiarla en las variables de entorno)
  const accessKey = process.env.SITE_ACCESS_KEY || 'dev'
  
  // Si el usuario proporciona el parámetro correcto, establecer una cookie
  if (accessParam === accessKey) {
    const response = NextResponse.next()
    // Cookie válida por 7 días
    response.cookies.set('site_access', 'granted', {
      maxAge: 60 * 60 * 24 * 7, // 7 días
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    return response
  }
  
  // Si el usuario ya tiene la cookie de acceso, permitir el paso
  if (accessCookie === 'granted') {
    return NextResponse.next()
  }
  
  // Redirigir a la página de "Coming Soon"
  const url = request.nextUrl.clone()
  url.pathname = '/coming-soon'
  // Limpiar el searchParams para evitar loops
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
