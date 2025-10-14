'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthError } from './auth-error';
import Link from 'next/link';

interface EmailRegisterFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function EmailRegisterForm({ onSubmit, isLoading = false, error }: EmailRegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !acceptTerms) return;
    if (password !== confirmPassword) return;
    
    await onSubmit(email, password);
  };

  const passwordsMatch = password === confirmPassword || confirmPassword === '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your email and password to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="terms" className="text-sm">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>

          <AuthError error={error} />

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !acceptTerms || !passwordsMatch}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
