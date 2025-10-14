"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

interface PrivacyWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
}

export function PrivacyWarningDialog({ open, onOpenChange, onAccept, onDecline }: PrivacyWarningDialogProps) {
  const handleAccept = () => {
    onAccept();
    onOpenChange(false);
  };

  const handleDecline = () => {
    onDecline();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Privacy Notice</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You are about to enable session history storage. This means your conversation data will be saved locally.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">What we collect:</h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Your voice transcripts (what you say)</li>
                <li>• AI responses and transcripts</li>
                <li>• Tool usage and results</li>
                <li>• Session metadata (timing, configuration)</li>
              </ul>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Your data is:</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Stored locally in your browser</li>
                <li>• Automatically deleted after 24 hours</li>
                <li>• Not shared with third parties</li>
                <li>• You can delete it anytime</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              By continuing, you consent to this data collection. You can disable this feature at any time.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDecline}>Decline</AlertDialogCancel>
          <AlertDialogAction onClick={handleAccept}>Accept & Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
