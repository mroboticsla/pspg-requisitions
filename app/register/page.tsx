"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la página de login en modo registro
    router.replace("/login?mode=register");
  }, [router]);

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        <p className="mt-4 text-neutral-600">Redirigiendo...</p>
      </div>
    </div>
  );
}
