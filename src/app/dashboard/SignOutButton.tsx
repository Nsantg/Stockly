'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-sm font-medium text-muted hover:text-ink transition-colors duration-200"
    >
      Cerrar sesión
    </button>
  );
}
