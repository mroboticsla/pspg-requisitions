/**
 * AdminLayout - Componente de layout reutilizable para pantallas de administración
 * 
 * Proporciona un contenedor consistente con:
 * - Fondo de página estándar
 * - Padding responsive
 * - Espaciado consistente
 * 
 * @example
 * ```tsx
 * <AdminLayout>
 *   <AdminLayout.Header 
 *     title="Gestión de Usuarios"
 *     action={<button>Crear nuevo</button>}
 *   />
 *   <AdminLayout.Card>
 *     Contenido
 *   </AdminLayout.Card>
 * </AdminLayout>
 * ```
 */

import React from 'react'

interface AdminLayoutProps {
  children: React.ReactNode
  className?: string
}

interface AdminLayoutHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  backButton?: boolean
  onBack?: () => void
}

interface AdminLayoutCardProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
  noPadding?: boolean
}

/**
 * Contenedor principal para páginas de administración
 */
export function AdminLayout({ children, className = '' }: AdminLayoutProps) {
  return (
    <div className={`min-h-screen bg-admin-bg-page ${className}`}>
      <div className="space-y-admin-lg p-admin-sm sm:p-admin-md lg:p-admin-lg">
        {children}
      </div>
    </div>
  )
}

/**
 * Header de página con título y acción opcional
 */
AdminLayout.Header = function AdminLayoutHeader({ 
  title, 
  subtitle,
  action,
  backButton = false,
  onBack 
}: AdminLayoutHeaderProps) {
  return (
    <div className="space-y-admin-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-admin-md">
        <div className="flex items-center gap-admin-md">
          {backButton && onBack && (
            <button
              onClick={onBack}
              className="p-admin-sm rounded-admin hover:bg-admin-bg-hover transition-colors flex-shrink-0"
              title="Volver"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-admin-text-primary">
            {title}
          </h1>
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-admin-text-secondary">
          {subtitle}
        </p>
      )}
    </div>
  )
}

/**
 * Tarjeta/Card para contenido de administración
 */
AdminLayout.Card = function AdminLayoutCard({ 
  children, 
  title, 
  description,
  className = '',
  noPadding = false 
}: AdminLayoutCardProps) {
  return (
    <div className={`bg-admin-bg-card rounded-admin shadow-sm overflow-hidden ${className}`}>
      {(title || description) && (
        <div className="px-admin-md sm:px-admin-lg pt-admin-md sm:pt-admin-lg pb-admin-sm">
          {title && (
            <h2 className="text-base sm:text-lg font-semibold text-admin-primary mb-admin-xs">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-xs sm:text-sm text-admin-text-secondary">
              {description}
            </p>
          )}
        </div>
      )}
      <div className={noPadding ? '' : 'p-admin-md sm:p-admin-lg'}>
        {children}
      </div>
    </div>
  )
}

/**
 * Búsqueda estándar para listas
 */
AdminLayout.Search = function AdminLayoutSearch({ 
  value, 
  onChange, 
  placeholder = "Buscar..." 
}: { 
  value: string
  onChange: (value: string) => void
  placeholder?: string 
}) {
  return (
    <div className="bg-admin-bg-card rounded-admin shadow-sm p-admin-md">
      <input 
        type="text"
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder} 
        className="w-full rounded-admin-sm border border-admin-border px-admin-md py-admin-sm focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent text-sm sm:text-base" 
      />
    </div>
  )
}

/**
 * Lista con divisores
 */
AdminLayout.List = function AdminLayoutList({ 
  children,
  emptyMessage = "No hay elementos para mostrar"
}: { 
  children: React.ReactNode
  emptyMessage?: string
}) {
  const childrenArray = React.Children.toArray(children)
  
  return (
    <div className="bg-admin-bg-card rounded-admin shadow-sm overflow-hidden">
      {childrenArray.length === 0 ? (
        <div className="p-admin-xl text-center text-admin-text-muted">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y divide-admin-border">
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Item de lista
 */
AdminLayout.ListItem = function AdminLayoutListItem({ 
  children,
  onClick,
  hover = true
}: { 
  children: React.ReactNode
  onClick?: () => void
  hover?: boolean
}) {
  return (
    <div 
      className={`p-admin-md sm:p-admin-lg transition-colors ${hover ? 'hover:bg-admin-bg-hover' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

/**
 * Contenedor de botones de formulario
 */
AdminLayout.FormActions = function AdminLayoutFormActions({ 
  children,
  align = 'left'
}: { 
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
}) {
  const alignClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''
  
  return (
    <div className={`flex flex-col sm:flex-row gap-admin-sm ${alignClass}`}>
      {children}
    </div>
  )
}

/**
 * Grid responsive para tarjetas
 */
AdminLayout.Grid = function AdminLayoutGrid({ 
  children,
  cols = { sm: 1, md: 2, lg: 3 }
}: { 
  children: React.ReactNode
  cols?: { sm?: number; md?: number; lg?: number }
}) {
  const colsClass = `grid grid-cols-${cols.sm || 1} ${cols.md ? `md:grid-cols-${cols.md}` : ''} ${cols.lg ? `lg:grid-cols-${cols.lg}` : ''} gap-admin-lg`
  
  return (
    <div className={colsClass}>
      {children}
    </div>
  )
}

/**
 * Mensaje de estado vacío
 */
AdminLayout.EmptyState = function AdminLayoutEmptyState({ 
  icon,
  title,
  description,
  action
}: { 
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-admin-2xl px-admin-lg">
      {icon && (
        <div className="mb-admin-md flex justify-center text-admin-text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-admin-text-primary mb-admin-xs">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-admin-text-secondary mb-admin-md">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-admin-md">
          {action}
        </div>
      )}
    </div>
  )
}

export default AdminLayout
