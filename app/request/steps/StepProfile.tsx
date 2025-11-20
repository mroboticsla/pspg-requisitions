'use client'

import React from 'react'
import JobProfileForm from '@/app/components/JobProfileForm'

interface Props {
  formData: Record<string, any>
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  handleNestedCheckboxChange: (section: string, field: string, checked: boolean) => void
}

export default function StepProfile({
  formData,
  handleInputChange,
  handleNestedCheckboxChange,
}: Props) {
  return (
    <JobProfileForm
      data={formData}
      onChange={handleInputChange}
      onNestedChange={handleNestedCheckboxChange}
    />
  )
}
