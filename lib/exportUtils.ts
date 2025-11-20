import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FullCandidateProfile } from '@/lib/types/candidates'

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

/**
 * Genera y descarga un PDF con el perfil del candidato
 */
export function downloadCandidatePDF(candidate: FullCandidateProfile): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  let yPos = 20

  // Helper para texto con salto de línea
  const addText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' | 'italic' = 'normal', color: string = '#000000') => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle)
    doc.setTextColor(color)
    
    const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2))
    doc.text(splitText, margin, yPos)
    yPos += (splitText.length * fontSize * 0.5) + 2
  }

  // Header
  addText(`${candidate.first_name} ${candidate.last_name}`, 24, 'bold', '#1a365d') // Brand dark color approx
  yPos += 5

  // Contact Info
  const contactInfo = [
    candidate.email,
    candidate.phone,
    candidate.linkedin_url ? 'LinkedIn: Disponible' : '',
    candidate.portfolio_url ? 'Portafolio: Disponible' : ''
  ].filter(Boolean).join(' | ')
  
  addText(contactInfo, 10, 'normal', '#4a5568')
  yPos += 10

  // Summary
  if (candidate.summary) {
    addText('Resumen Profesional', 14, 'bold', '#2d3748')
    yPos += 2
    addText(candidate.summary, 10, 'normal', '#4a5568')
    yPos += 10
  }

  // Experience
  if (candidate.experience && candidate.experience.length > 0) {
    addText('Experiencia Laboral', 14, 'bold', '#2d3748')
    yPos += 2

    const expData = candidate.experience.map(exp => [
      exp.position,
      exp.company,
      `${exp.start_date} - ${exp.is_current ? 'Presente' : exp.end_date}`,
      exp.description || ''
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Cargo', 'Empresa', 'Periodo', 'Descripción']],
      body: expData,
      theme: 'grid',
      headStyles: { fillColor: [26, 54, 93] }, // Brand dark
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 'auto' }
      },
      margin: { left: margin, right: margin }
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // Education
  if (candidate.education && candidate.education.length > 0) {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    addText('Educación', 14, 'bold', '#2d3748')
    yPos += 2

    const eduData = candidate.education.map(edu => [
      edu.degree,
      edu.field_of_study,
      edu.institution,
      `${edu.start_date} - ${edu.is_current ? 'Presente' : edu.end_date}`
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Título', 'Campo de Estudio', 'Institución', 'Periodo']],
      body: eduData,
      theme: 'grid',
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin }
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // Job Profile / Skills
  if (candidate.job_profile) {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    addText('Perfil Profesional y Habilidades', 14, 'bold', '#2d3748')
    yPos += 2

    const skillsData = []

    // Formación Académica
    const formacion = []
    if (candidate.job_profile.bachiller) formacion.push('Bachiller')
    if (candidate.job_profile.tecnico) formacion.push('Técnico')
    if (candidate.job_profile.profesional) formacion.push('Profesional')
    if (candidate.job_profile.especializacion) formacion.push('Especialización')
    if (candidate.job_profile.estudianteUniversitario) formacion.push('Estudiante Universitario')
    if (candidate.job_profile.otrosEstudios) formacion.push(`Otros: ${candidate.job_profile.otrosEstudios}`)
    
    if (formacion.length > 0) {
      skillsData.push(['Formación Académica', formacion.join(', ')])
    }

    // Idiomas
    const idiomas = []
    if (candidate.job_profile.idiomaEspanol) idiomas.push('Español')
    if (candidate.job_profile.idiomaIngles) idiomas.push('Inglés')
    if (candidate.job_profile.idiomaFrances) idiomas.push('Francés')
    if (candidate.job_profile.idiomaAleman) idiomas.push('Alemán')
    if (candidate.job_profile.idiomaPortugues) idiomas.push('Portugués')
    if (candidate.job_profile.idiomaItaliano) idiomas.push('Italiano')
    if (candidate.job_profile.idiomaMandarin) idiomas.push('Mandarín')
    
    if (idiomas.length > 0) {
      skillsData.push(['Idiomas', idiomas.join(', ')])
    }

    // Informática
    const informatica = []
    if (candidate.job_profile.sistemaOperativo) {
      const os = Object.entries(candidate.job_profile.sistemaOperativo)
        .filter(([_, v]) => v).map(([k]) => k).join(', ')
      if (os) informatica.push(`Sistemas Operativos: ${os}`)
    }
    if (candidate.job_profile.wordExcelPowerPoint) {
       const office = Object.entries(candidate.job_profile.wordExcelPowerPoint)
        .filter(([_, v]) => v).map(([k]) => k).join(', ')
       if (office) informatica.push(`Office: ${office}`)
    }
    if (candidate.job_profile.baseDatos) {
      const bd = Object.entries(candidate.job_profile.baseDatos)
       .filter(([_, v]) => v).map(([k]) => k).join(', ')
      if (bd) informatica.push(`Bases de Datos: ${bd}`)
    }
    if (candidate.job_profile.internet) {
      const internet = Object.entries(candidate.job_profile.internet)
       .filter(([_, v]) => v).map(([k]) => k).join(', ')
      if (internet) informatica.push(`Internet: ${internet}`)
    }
    if (candidate.job_profile.correoElectronico) {
      const email = Object.entries(candidate.job_profile.correoElectronico)
       .filter(([_, v]) => v).map(([k]) => k).join(', ')
      if (email) informatica.push(`Correo Electrónico: ${email}`)
    }
    
    if (informatica.length > 0) {
      skillsData.push(['Informática', informatica.join('\n')])
    }

    // Habilidades Técnicas
    const tecnicas = []
    if (candidate.job_profile.informacion) tecnicas.push('Manejo de información confidencial')
    if (candidate.job_profile.maquinariaEquipos) tecnicas.push('Manejo de maquinaria/equipos')
    if (candidate.job_profile.decisiones) tecnicas.push('Toma de decisiones')
    if (candidate.job_profile.supervisionPersonal) tecnicas.push('Supervisión de personal')
    
    if (tecnicas.length > 0) {
      skillsData.push(['Habilidades Técnicas', tecnicas.join('\n')])
    }

    // Responsabilidad y Supervisión
    const respSup = []
    if (candidate.job_profile.responsabilidades) {
      const resp = Object.entries(candidate.job_profile.responsabilidades)
        .filter(([_, v]) => v).map(([k]) => k).join(', ')
      if (resp) respSup.push(`Tipo de Responsabilidad: ${resp}`)
    }
    if (candidate.job_profile.supervision) {
      const sup = Object.entries(candidate.job_profile.supervision)
        .filter(([_, v]) => v).map(([k]) => k).join(', ')
      if (sup) respSup.push(`Tipo de Supervisión: ${sup}`)
    }

    if (respSup.length > 0) {
      skillsData.push(['Responsabilidad y Supervisión', respSup.join('\n')])
    }

    // Otros
    if (candidate.job_profile.otroEspecifique) {
      skillsData.push(['Otras Habilidades', candidate.job_profile.otroEspecifique])
    }

    if (skillsData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Categoría', 'Detalle']],
        body: skillsData,
        theme: 'grid',
        headStyles: { fillColor: [26, 54, 93] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
      })
    }
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Generado el ${new Date().toLocaleDateString('es-ES')} - PSP Group Requisitions`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  doc.save(`Perfil_${candidate.first_name}_${candidate.last_name}.pdf`)
}
