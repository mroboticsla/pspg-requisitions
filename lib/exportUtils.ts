/**
 * Utilidades para exportar datos a diferentes formatos
 */

type ExportData = Record<string, any>[]

/**
 * Convierte datos a formato CSV
 */
export function convertToCSV(data: ExportData, headers?: string[]): string {
  if (data.length === 0) return ''

  // Si no se proporcionan headers, usar las keys del primer objeto
  const csvHeaders = headers || Object.keys(data[0])
  
  // Crear la fila de encabezados
  const headerRow = csvHeaders.join(',')
  
  // Crear las filas de datos
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header]
      // Escapar valores que contengan comas o comillas
      if (value === null || value === undefined) return ''
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }).join(',')
  }).join('\n')
  
  return `${headerRow}\n${dataRows}`
}

/**
 * Descarga un archivo CSV
 */
export function downloadCSV(data: ExportData, filename: string, headers?: string[]): void {
  const csv = convertToCSV(data, headers)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }) // UTF-8 BOM para Excel
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Descarga datos en formato JSON
 */
export function downloadJSON(data: any, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Convierte datos a formato Excel (HTML table que Excel puede abrir)
 */
export function downloadExcel(data: ExportData, filename: string, headers?: string[]): void {
  if (data.length === 0) return

  const csvHeaders = headers || Object.keys(data[0])
  
  // Crear tabla HTML
  let html = '<table><thead><tr>'
  csvHeaders.forEach(header => {
    html += `<th>${header}</th>`
  })
  html += '</tr></thead><tbody>'
  
  data.forEach(row => {
    html += '<tr>'
    csvHeaders.forEach(header => {
      const value = row[header] === null || row[header] === undefined ? '' : row[header]
      html += `<td>${value}</td>`
    })
    html += '</tr>'
  })
  html += '</tbody></table>'
  
  // Crear blob con tipo Excel
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.xls`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Formatea datos de usuarios para exportación
 */
export function formatUsersForExport(users: any[]): ExportData {
  return users.map(user => ({
    'ID': user.id,
    'Nombre': user.first_name || '',
    'Apellido': user.last_name || '',
    'Teléfono': user.phone || '',
    'Rol': Array.isArray(user.roles) ? user.roles[0]?.name : user.roles?.name || 'Sin rol',
    'Estado': user.is_active !== false ? 'Activo' : 'Inactivo',
    'Fecha Creación': user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : ''
  }))
}

/**
 * Formatea datos de roles para exportación
 */
export function formatRolesForExport(roles: any[]): ExportData {
  return roles.map(role => ({
    'ID': role.id,
    'Nombre': role.name,
    'Permisos': JSON.stringify(role.permissions || {})
  }))
}
