'use client'

import React from 'react'
import type { UserCompany } from '@/lib/types/company'

interface Props {
  loadingCompanies: boolean
  userCompanies: UserCompany[]
  userRole: string | null
  editRequisitionId: string | null
  formData: Record<string, any>
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
}

export default function StepGeneralData({
  loadingCompanies,
  userCompanies,
  userRole,
  editRequisitionId,
  formData,
  handleInputChange,
}: Props) {
  return (
    <div className="form-section">
      <div className="form-section-header">DATOS GENERALES</div>
      <div className="form-section-content">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NOMBRE DE LA EMPRESA <span className="text-red-600">*</span>
            </label>
            {loadingCompanies ? (
              <div className="form-input flex items-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                Cargando empresas...
              </div>
            ) : userCompanies.length === 0 ? (
              <div className="form-input text-red-600">
                No tiene empresas asignadas. Contacte al administrador.
              </div>
            ) : (
              <>
                <select
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  disabled={!!editRequisitionId}
                >
                  <option value="">Seleccione una empresa</option>
                  {userCompanies.map((company) => (
                    <option key={company.company_id} value={company.company_id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
                {editRequisitionId && (
                  <p className="mt-1 text-xs text-gray-500">
                    No se puede cambiar la empresa al editar una requisición
                  </p>
                )}
                {!editRequisitionId && (userRole === 'admin' || userRole === 'superadmin') && (
                  <p className="mt-1 text-xs text-brand-accent">
                    <span className="font-semibold">Admin:</span> Puede ver todas las empresas activas
                  </p>
                )}
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DEPARTAMENTO</label>
            <input
              type="text"
              name="departamento"
              value={formData.departamento}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PUESTO REQUERIDO</label>
            <input
              type="text"
              name="puestoRequerido"
              value={formData.puestoRequerido}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NÚMERO DE VACANTES</label>
            <input
              type="number"
              name="numeroVacantes"
              value={formData.numeroVacantes}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
