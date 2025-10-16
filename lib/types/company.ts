// Tipos para el manejo de empresas y asignación de usuarios

export interface Company {
  id: string
  name: string
  legal_name: string | null
  tax_id: string | null
  industry: string | null
  website: string | null
  logo_url: string | null
  address: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  } | null
  contact_info: {
    email?: string
    phone?: string
    mobile?: string
  } | null
  is_active: boolean
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string | null
}

export interface CompanyUser {
  id: string
  company_id: string
  user_id: string
  role_in_company: 'admin' | 'member' | 'viewer'
  permissions: Record<string, any> | null
  assigned_at: string
  assigned_by: string | null
  is_active: boolean
}

export interface CompanyWithUsers extends Company {
  company_users?: Array<CompanyUser & {
    profiles?: {
      id: string
      first_name: string | null
      last_name: string | null
      phone: string | null
    }
  }>
}

export interface UserCompany {
  company_id: string
  company_name: string
  role_in_company: string
  is_active: boolean
}
