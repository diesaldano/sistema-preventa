'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedireccionDespachoLogin() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a /login
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">Redireccionando...</p>
    </div>
  );
}
