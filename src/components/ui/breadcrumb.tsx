import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex", className)}
        {...props}
      >
        <ol className="flex items-center space-x-1 text-sm text-gray-500">
          <li>
            <Link
              href="/"
              className="flex items-center hover:text-camara-primary transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Início</span>
            </Link>
          </li>
          
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
              {item.href && !item.current ? (
                <Link
                  href={item.href}
                  className="hover:text-camara-primary transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span 
                  className={cn(
                    "font-medium",
                    item.current ? "text-gray-900" : "text-gray-500"
                  )}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    )
  }
)

Breadcrumb.displayName = "Breadcrumb"

export { Breadcrumb }
