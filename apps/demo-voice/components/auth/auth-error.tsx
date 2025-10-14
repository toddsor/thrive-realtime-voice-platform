'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AuthErrorProps {
  error: string | null | undefined;
  className?: string;
}

export function AuthError({ error, className }: AuthErrorProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
