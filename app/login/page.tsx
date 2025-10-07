"use client";

import { useEffect } from "react";
import { useSafeRouter } from "../../lib/useSafeRouter";

export default function LoginPage() {
  const router = useSafeRouter();

  useEffect(() => {
    // Redirigir a la nueva página de autenticación unificada
    router.replace("/auth");
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
