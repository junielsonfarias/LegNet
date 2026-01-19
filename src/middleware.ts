import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")

    // Se é rota admin e está autenticado, verificar role
    if (isAdminRoute && token) {
      const allowedRoles = ["ADMIN", "EDITOR", "PARLAMENTAR", "OPERADOR", "SECRETARIA"]
      if (!allowedRoles.includes(token.role as string)) {
        return NextResponse.redirect(new URL("/", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Requer autenticação para acessar rotas admin
        return !!token
      },
    },
    pages: {
      signIn: "/login",
    },
  }
)

// Proteger apenas rotas /admin/*
export const config = {
  matcher: ["/admin/:path*"]
}
