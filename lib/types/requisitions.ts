// =====================================================
// Tipos para Sistema de Requisiciones Personalizables
// =====================================================

/**
 * Plantilla de formulario personalizable por empresa
 */
export interface FormTemplate {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  version: number;
  is_active: boolean;
  num_main_functions: number; // Número de campos de funciones principales (1-10)
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Sección personalizada del formulario
 */
export interface FormSection {
  id: string;
  template_id: string;
  name: string;
  description?: string;
  position: number; // 0 = al final, 1+ = después de sección N
  is_required: boolean;
  created_at: string;
}

/**
 * Tipos de campos soportados
 */
export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'date' 
  | 'email' 
  | 'phone' 
  | 'checkbox' 
  | 'radio' 
  | 'select' 
  | 'multi-select'
  | 'currency';

/**
 * Validaciones para campos
 */
export interface FieldValidation {
  required?: boolean;
  min?: number; // Para números y longitud de texto
  max?: number; // Para números y longitud de texto
  pattern?: string; // Regex para validación
  minLength?: number;
  maxLength?: number;
}

/**
 * Campo individual dentro de una sección
 */
export interface FormField {
  id: string;
  section_id: string;
  name: string; // Usado como key en JSONB
  label: string; // Etiqueta visible
  field_type: FieldType;
  options?: string[]; // Para select, radio, checkbox
  validation?: FieldValidation;
  placeholder?: string;
  help_text?: string;
  position: number; // Orden dentro de la sección
  created_at: string;
}

/**
 * Sección completa con sus campos
 */
export interface FormSectionWithFields extends FormSection {
  fields: FormField[];
}

/**
 * Plantilla completa con secciones y campos
 */
export interface FormTemplateComplete extends FormTemplate {
  sections: FormSectionWithFields[];
}

/**
 * Estados de una requisición
 */
export type RequisitionStatus = 
  | 'draft'        // Borrador
  | 'submitted'    // Enviada
  | 'in_review'    // En revisión
  | 'approved'     // Aprobada
  | 'rejected'     // Rechazada
  | 'cancelled'    // Cancelada
  | 'filled';      // Completada/Cubierta

/**
 * Tipo de puesto
 */
export interface TipoPuesto {
  nuevaCreacion?: boolean;
  reemplazoTemporal?: boolean;
  reemplazoDefinitivo?: boolean;
  incrementoPlantilla?: boolean;
}

/**
 * Formación académica
 */
export interface FormacionAcademica {
  bachiller?: boolean;
  tecnico?: boolean;
  universitario?: boolean;
  maestria?: boolean;
  doctorado?: boolean;
  otro?: boolean;
  detalles?: string;
}

/**
 * Nivel de habilidad informática
 */
export type NivelHabilidad = 'basico' | 'intermedio' | 'avanzado' | 'experto';

/**
 * Habilidades informáticas
 */
export interface HabilidadInformatica {
  word?: NivelHabilidad;
  excel?: NivelHabilidad;
  powerpoint?: NivelHabilidad;
  outlook?: NivelHabilidad;
  internet?: NivelHabilidad;
  software_especifico?: {
    nombre: string;
    nivel: NivelHabilidad;
  }[];
}

/**
 * Habilidades técnicas
 */
export interface HabilidadesTecnicas {
  informacion?: boolean;
  maquinariaEquipos?: boolean;
  idiomas?: boolean;
  certificaciones?: boolean;
  licencias?: boolean;
  detalles?: string;
}

/**
 * Requisición de personal
 */
export interface Requisition {
  id: string;
  company_id: string;
  created_by: string;
  template_id?: string;
  template_snapshot: FormTemplateComplete; // Snapshot completo de la plantilla
  status: RequisitionStatus;
  
  // DATOS GENERALES
  departamento?: string;
  puesto_requerido?: string;
  numero_vacantes?: number;
  
  // INFORMACIÓN SOBRE EL PUESTO
  tipo_puesto?: TipoPuesto;
  motivo_puesto?: string;
  nombre_empleado_reemplaza?: string;
  
  // FUNCIONES PRINCIPALES (dinámico)
  funciones_principales?: string[];
  
  // PERFIL DEL PUESTO
  formacion_academica?: FormacionAcademica;
  otros_estudios?: string;
  idioma_ingles?: boolean;
  
  // HABILIDAD INFORMÁTICA
  habilidad_informatica?: HabilidadInformatica;
  
  // HABILIDADES Y CONOCIMIENTOS TÉCNICOS
  habilidades_tecnicas?: HabilidadesTecnicas;
  
  // Metadatos
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Respuestas a campos personalizados
 */
export interface RequisitionResponse {
  id: string;
  requisition_id: string;
  section_id: string;
  responses: Record<string, any>; // { "nombreCampo": valor }
  created_at: string;
}

/**
 * Requisición completa con respuestas
 */
export interface RequisitionComplete extends Requisition {
  custom_responses: RequisitionResponse[];
}

/**
 * Datos para crear una requisición
 */
export interface CreateRequisitionData {
  company_id: string;
  departamento?: string;
  puesto_requerido?: string;
  numero_vacantes?: number;
  tipo_puesto?: TipoPuesto;
  motivo_puesto?: string;
  nombre_empleado_reemplaza?: string;
  funciones_principales?: string[];
  formacion_academica?: FormacionAcademica;
  otros_estudios?: string;
  idioma_ingles?: boolean;
  habilidad_informatica?: HabilidadInformatica;
  habilidades_tecnicas?: HabilidadesTecnicas;
  custom_responses?: Record<string, Record<string, any>>; // { section_id: { campo: valor } }
}

/**
 * Datos para actualizar una requisición
 */
export interface UpdateRequisitionData extends Partial<CreateRequisitionData> {
  status?: RequisitionStatus;
}

/**
 * Filtros para listar requisiciones
 */
export interface RequisitionFilters {
  company_id?: string;
  status?: RequisitionStatus | RequisitionStatus[];
  created_by?: string;
  date_from?: string;
  date_to?: string;
  search?: string; // Búsqueda por puesto o departamento
}

/**
 * Datos para crear una plantilla
 */
export interface CreateTemplateData {
  company_id: string;
  name: string;
  description?: string;
  num_main_functions?: number;
}

/**
 * Datos para crear una sección
 */
export interface CreateSectionData {
  template_id: string;
  name: string;
  description?: string;
  position?: number;
  is_required?: boolean;
}

/**
 * Datos para crear un campo
 */
export interface CreateFieldData {
  section_id: string;
  name: string;
  label: string;
  field_type: FieldType;
  options?: string[];
  validation?: FieldValidation;
  placeholder?: string;
  help_text?: string;
  position?: number;
}

/**
 * Estadísticas de requisiciones
 */
export interface RequisitionStats {
  total: number;
  by_status: Record<RequisitionStatus, number>;
  by_company: Record<string, number>;
  avg_time_to_fill?: number; // En días
}
