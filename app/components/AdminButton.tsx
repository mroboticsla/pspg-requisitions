/**
 * AdminButton - Componentes de botones reutilizables para pantallas de administración
 * 
 * Proporciona botones consistentes con los estilos de administración
 */

import React from 'react'
import { LucideIcon } from 'lucide-react'

interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
}

/**
 * Botón principal verde para acciones positivas (crear, confirmar)
 */
export function AdminButtonPrimary({ 
  children, 
  icon: Icon, 
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props 
}: BaseButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 px-admin-lg py-admin-sm rounded-admin bg-admin-success text-admin-text-inverse hover:bg-admin-successHover disabled:opacity-50 transition-colors font-medium shadow-sm ${fullWidth ? 'w-full' : 'w-full sm:w-auto'} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Procesando...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </button>
  )
}

/**
 * Botón secundario rojo/rosa para acciones importantes (guardar, editar)
 */
export function AdminButtonSecondary({ 
  children, 
  icon: Icon, 
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props 
}: BaseButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 px-admin-lg py-admin-sm rounded-admin bg-admin-accent text-admin-text-inverse hover:bg-admin-accentHover disabled:opacity-50 transition-colors font-medium ${fullWidth ? 'w-full' : 'w-full sm:w-auto'} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Procesando...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </button>
  )
}

/**
 * Botón peligroso rojo para acciones destructivas (eliminar)
 */
export function AdminButtonDanger({ 
  children, 
  icon: Icon, 
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props 
}: BaseButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 px-admin-md py-admin-sm rounded-admin bg-admin-danger text-admin-text-inverse hover:bg-admin-dangerHover disabled:opacity-50 transition-colors font-medium ${fullWidth ? 'w-full' : 'w-full sm:w-auto'} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Eliminando...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </button>
  )
}

/**
 * Botón outline con borde azul oscuro
 */
export function AdminButtonOutline({ 
  children, 
  icon: Icon, 
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props 
}: BaseButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 px-admin-md py-admin-sm rounded-admin border border-admin-primary text-admin-primary hover:bg-admin-primary hover:text-admin-text-inverse disabled:opacity-50 transition-colors font-medium ${fullWidth ? 'w-full' : 'w-full sm:w-auto'} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
          <span>Procesando...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </button>
  )
}

/**
 * Botón neutral/ghost para cancelar o acciones secundarias
 */
export function AdminButtonGhost({ 
  children, 
  icon: Icon, 
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props 
}: BaseButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 px-admin-lg py-admin-sm rounded-admin border border-admin-border hover:bg-admin-bg-hover disabled:opacity-50 transition-colors font-medium ${fullWidth ? 'w-full' : 'w-full sm:w-auto'} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
          <span>Procesando...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </button>
  )
}

/**
 * Botón pequeño solo con icono
 */
export function AdminButtonIcon({ 
  icon: Icon,
  label,
  variant = 'ghost',
  disabled,
  className = '',
  ...props 
}: Omit<BaseButtonProps, 'children'> & { 
  icon: LucideIcon
  label: string
  variant?: 'ghost' | 'primary' | 'danger'
}) {
  const variantClasses = {
    ghost: 'hover:bg-admin-bg-hover text-admin-text-primary',
    primary: 'bg-admin-primary text-admin-text-inverse hover:bg-admin-primary/90',
    danger: 'bg-admin-danger text-admin-text-inverse hover:bg-admin-dangerHover'
  }

  return (
    <button
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`p-admin-sm rounded-admin transition-colors disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      <Icon className="w-5 h-5" />
    </button>
  )
}

// Export all buttons as named exports
export const AdminButton = {
  Primary: AdminButtonPrimary,
  Secondary: AdminButtonSecondary,
  Danger: AdminButtonDanger,
  Outline: AdminButtonOutline,
  Ghost: AdminButtonGhost,
  Icon: AdminButtonIcon,
}

export default AdminButton
