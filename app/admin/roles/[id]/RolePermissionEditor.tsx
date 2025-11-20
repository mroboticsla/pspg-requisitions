import React from 'react'
import { MenuItem } from '@/app/components/navigation/menuConfig'
import { Check, Shield } from 'lucide-react'

interface RolePermissionEditorProps {
  menuItems: MenuItem[]
  modules: Record<string, boolean>
  canDo: string[]
  onChangeModules: (modules: Record<string, boolean>) => void
  onChangeCanDo: (canDo: string[]) => void
  disabled?: boolean
}

export default function RolePermissionEditor({
  menuItems,
  modules,
  canDo,
  onChangeModules,
  onChangeCanDo,
  disabled = false
}: RolePermissionEditorProps) {

  const toggleModule = (id: string) => {
    if (disabled) return
    // Determine current state
    // Root items (depth 0) default to false if undefined
    // Child items default to true if undefined
    // But here we just toggle the value in the map.
    // If it's undefined, we need to know what the "current" effective value is to toggle it.
    
    // However, to simplify, let's just check if it is explicitly true.
    // Wait, if I toggle a child that is implicitly true (undefined), I want to make it false.
    // If I toggle a child that is explicitly false, I want to make it true (or undefined/true).
    
    // Let's look at how we render it to know the current state.
    // We need to pass the depth or know if it is root.
    // Since we don't have easy access to depth here without traversing, 
    // maybe we should just use the same logic as render:
    
    // Actually, the toggle function is called from the render loop where we know the state.
    // So let's just pass the new value.
  }
  
  const handleModuleChange = (id: string, newValue: boolean) => {
    if (disabled) return
    const newModules = { ...modules, [id]: newValue }
    onChangeModules(newModules)
  }

  const togglePermission = (perm: string) => {
    if (disabled) return
    const newCanDo = canDo.includes(perm)
      ? canDo.filter(p => p !== perm)
      : [...canDo, perm]
    onChangeCanDo(newCanDo)
  }

  // Permisos generales que no están en el menú
  const generalPermissions = [
    { key: 'approve_requisitions', label: 'Aprobar Requisiciones' },
    { key: 'export_data', label: 'Exportar Datos' },
  ]

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasPermission = item.permission
    const isRoot = depth === 0
    
    // Logic matches filterMenuByModules:
    // Root: default false (must be explicitly true)
    // Child: default true (unless explicitly false)
    const isChecked = modules[item.id] !== undefined 
      ? modules[item.id] 
      : !isRoot

    return (
      <div key={item.id} className="border-b border-gray-100 last:border-0">
        <div 
          className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors ${depth > 0 ? 'bg-gray-50/50' : ''}`}
          style={{ paddingLeft: `${depth * 20 + 16}px` }}
        >
          <div className="flex items-center gap-3 flex-1">
            {item.icon && <item.icon className="w-4 h-4 text-gray-500" />}
            <span className={`text-sm ${isRoot ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
              {item.label}
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Visibilidad (Módulo) */}
            <label className="flex items-center gap-2 cursor-pointer select-none" title="Controla si esta opción aparece en el menú">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={isChecked} 
                onChange={() => handleModuleChange(item.id, !isChecked)}
                disabled={disabled}
              />
              <span className="text-xs text-gray-500 font-medium w-16">
                {isChecked ? 'Visible' : 'Oculto'}
              </span>
            </label>

            {/* Permiso (Can Do) */}
            <div className="w-48 flex items-center justify-end">
              {hasPermission ? (
                <label className="flex items-center gap-2 cursor-pointer select-none" title={`Permiso: ${item.permission}`}>
                  <span className="text-xs text-gray-500 font-medium text-right">
                    {item.permission}
                  </span>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${canDo.includes(item.permission!) ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-gray-300'}`}>
                    {canDo.includes(item.permission!) && <Shield className="w-3 h-3 text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={canDo.includes(item.permission!)} 
                    onChange={() => togglePermission(item.permission!)}
                    disabled={disabled}
                  />
                </label>
              ) : (
                <span className="text-xs text-gray-400 italic">Sin permiso asociado</span>
              )}
            </div>
          </div>
        </div>
        
        {item.children && item.children.map(child => renderMenuItem(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Menú y Permisos Vinculados */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Estructura del Menú y Permisos</h3>
          <div className="flex gap-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <span className="w-24 text-center">Visibilidad</span>
            <span className="w-48 text-right">Permiso Requerido</span>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {menuItems.map(item => renderMenuItem(item))}
        </div>
      </div>

      {/* Permisos Generales */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Permisos Generales</h3>
        <p className="text-sm text-gray-600 mb-4">
          Estos permisos no están vinculados directamente a una opción del menú, pero controlan funcionalidades específicas.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {generalPermissions.map(perm => (
            <label 
              key={perm.key} 
              className={`
                flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${canDo.includes(perm.key)
                  ? 'bg-emerald-50 border-emerald-300 shadow-sm' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="checkbox"
                checked={canDo.includes(perm.key)}
                onChange={() => togglePermission(perm.key)}
                className="w-4 h-4 text-brand-accent focus:ring-brand-accent border-gray-300 rounded"
                disabled={disabled}
              />
              <span className="text-sm text-gray-700">{perm.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
