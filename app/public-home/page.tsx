'use client';

import React from 'react';
import { PublicNavbar } from '../components/public/layout/PublicNavbar';
import { PublicFooter } from '../components/public/layout/PublicFooter';
import { HeroSlider } from '../components/public/home/HeroSlider';
import { AboutSection } from '../components/public/home/AboutSection';
import { StatsSection } from '../components/public/home/StatsSection';
import { ServicesSection } from '../components/public/home/ServicesSection';
import { ScheduleSection } from '../components/public/home/ScheduleSection';
import { ContactForm } from '../components/public/home/ContactForm';

export default function PublicHome() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-grow">
        <HeroSlider />
        <AboutSection />
        <StatsSection />
        <ServicesSection />
        <ScheduleSection />
        <ContactForm />
      </main>
      <PublicFooter />
    </div>
  );
}
