'use client'

import React from 'react'
import type { FormSectionWithFields } from '@/lib/types/requisitions'
import { DynamicSection } from '@/app/components/DynamicField'

interface Props {
  section: FormSectionWithFields
  values: Record<string, any>
  onChange: (sectionId: string, fieldName: string, value: any) => void
  disabled?: boolean
}

export default function StepCustomSection({ section, values, onChange, disabled }: Props) {
  return (
    <div className="space-y-6">
      <div className="border-t-2 border-brand-dark pt-6">
        <h3 className="text-lg font-bold text-brand-dark mb-4">INFORMACIÓN ADICIONAL PERSONALIZADA</h3>
      </div>
      <DynamicSection
        section={section}
        values={values}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  )
}
