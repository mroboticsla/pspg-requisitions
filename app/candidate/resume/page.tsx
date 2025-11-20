"use client";

import React, { useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import ProfessionalProfileSections from "../../profile/ProfessionalProfileSections";
import { FileText, Briefcase, GraduationCap, Award } from "lucide-react";

export default function CandidateResumePage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");

  if (!user) {
    return null;
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Offset para el header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const sections = [
    { id: 'overview', label: 'Resumen & CV', icon: FileText },
    { id: 'experience', label: 'Experiencia', icon: Briefcase },
    { id: 'education', label: 'Educación', icon: GraduationCap },
    { id: 'skills', label: 'Habilidades', icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Header con navegación rápida */}
      <div className="bg-white rounded-lg shadow-sm p-4 sticky top-0 z-10 border border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Mi CV Profesional</h1>
          
          {/* Navegación horizontal en desktop */}
          <nav className="hidden md:flex space-x-1">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-brand-light text-brand-dark'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Navegación móvil */}
        <div className="md:hidden mt-4 flex overflow-x-auto space-x-2 pb-2">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`flex-shrink-0 flex items-center px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                  activeSection === section.id
                    ? 'bg-brand-light text-brand-dark'
                    : 'text-gray-600 bg-gray-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5 mr-1" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido del CV con scroll spy */}
      <ProfessionalProfileSections 
        userId={user.id} 
        onSectionChange={setActiveSection}
      />
    </div>
  );
}
