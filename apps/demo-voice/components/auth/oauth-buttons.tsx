'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Chrome, Linkedin, Facebook } from 'lucide-react';

interface OAuthButtonsProps {
  onGoogleSignIn: () => void;
  onLinkedInSignIn: () => void;
  onFacebookSignIn: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

interface OAuthProvider {
  enabled: boolean;
  clientId?: string;
}

interface OAuthProviders {
  google: OAuthProvider;
  linkedin: OAuthProvider;
  facebook: OAuthProvider;
}

export function OAuthButtons({ 
  onGoogleSignIn, 
  onLinkedInSignIn, 
  onFacebookSignIn, 
  isLoading = false,
  disabled = false 
}: OAuthButtonsProps) {
  const [providers, setProviders] = useState<OAuthProviders | null>(null);

  useEffect(() => {
    // Fetch OAuth provider configuration from server
    fetch('/api/auth/providers')
      .then(res => res.json())
      .then(data => setProviders(data))
      .catch(err => console.error('Failed to fetch OAuth providers:', err));
  }, []);

  if (!providers) {
    return null; // Don't show anything while loading
  }

  const isGoogleEnabled = providers.google.enabled;
  const isLinkedInEnabled = providers.linkedin.enabled;
  const isFacebookEnabled = providers.facebook.enabled;

  const enabledProviders = [
    { key: 'google', enabled: isGoogleEnabled, label: 'Google', icon: Chrome, action: onGoogleSignIn },
    { key: 'linkedin', enabled: isLinkedInEnabled, label: 'LinkedIn', icon: Linkedin, action: onLinkedInSignIn },
    { key: 'facebook', enabled: isFacebookEnabled, label: 'Facebook', icon: Facebook, action: onFacebookSignIn },
  ].filter(provider => provider.enabled);

  if (enabledProviders.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in with</CardTitle>
        <CardDescription>
          Choose your preferred sign-in method
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {enabledProviders.map((provider) => {
            const Icon = provider.icon;
            return (
              <Button
                key={provider.key}
                variant="outline"
                onClick={provider.action}
                disabled={disabled || isLoading}
                className="w-full"
              >
                <Icon className="mr-2 h-4 w-4" />
                Continue with {provider.label}
              </Button>
            );
          })}
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
