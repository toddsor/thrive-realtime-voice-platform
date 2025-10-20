"use client";

import { useState } from "react";
import { useIdentity } from "@/lib/hooks/useIdentity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, User, UserCheck, ArrowRight, CheckCircle } from "lucide-react";

interface UpgradePromptProps {
  trigger?: React.ReactNode;
  onUpgrade?: (level: string) => void;
}

export function UpgradePrompt({ trigger, onUpgrade }: UpgradePromptProps) {
  const { level, isLoading, error, upgradeToAnonymous, upgradeToPseudonymous, getUpgradeOptions } = useIdentity();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [pseudonym, setPseudonym] = useState("");
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState<"select" | "details" | "confirm">("select");

  const upgradeOptions = getUpgradeOptions();

  const handleUpgrade = async () => {
    if (!selectedLevel) return;

    try {
      if (selectedLevel === "anonymous") {
        await upgradeToAnonymous();
      } else if (selectedLevel === "pseudonymous") {
        if (!pseudonym.trim()) return;
        await upgradeToPseudonymous(pseudonym.trim());
      }

      onUpgrade?.(selectedLevel);
      setIsOpen(false);
      setStep("select");
      setPseudonym("");
      setConsent(false);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const canProceed = () => {
    if (selectedLevel === "pseudonymous") {
      return pseudonym.trim().length > 0 && consent;
    }
    return consent;
  };

  const resetDialog = () => {
    setStep("select");
    setSelectedLevel(null);
    setPseudonym("");
    setConsent(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetDialog();
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case "anonymous":
        return User;
      case "pseudonymous":
        return UserCheck;
      case "authenticated":
        return UserCheck;
      default:
        return Shield;
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button variant="outline" onClick={() => setIsOpen(true)} disabled={upgradeOptions.length === 0}>
          Upgrade Identity
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade Your Identity</DialogTitle>
            <DialogDescription>Choose how you'd like to store your conversation data.</DialogDescription>
          </DialogHeader>

          {step === "select" && (
            <div className="space-y-4">
              {upgradeOptions.map((option) => {
                const Icon = getIcon(option.level);
                return (
                  <div
                    key={option.level}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedLevel === option.level
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => {
                      setSelectedLevel(option.level);
                      setStep("details");
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 mt-0.5 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-medium">{option.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                        <div className="space-y-1">
                          {option.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === "details" && selectedLevel && (
            <div className="space-y-4">
              {selectedLevel === "pseudonymous" && (
                <div className="space-y-2">
                  <Label htmlFor="pseudonym">Choose a nickname</Label>
                  <Input
                    id="pseudonym"
                    placeholder="Enter your nickname"
                    value={pseudonym}
                    onChange={(e) => setPseudonym(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be your public identifier. You can change it later.
                  </p>
                </div>
              )}

              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Data Storage Consent</p>
                    <p className="text-sm">
                      By upgrading, you agree to store your conversation data on our servers.
                      {selectedLevel === "anonymous" && " Data will be automatically deleted after 14 days."}
                      {selectedLevel === "pseudonymous" && " Data will be stored for 90 days."}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked as boolean)}
                />
                <Label htmlFor="consent" className="text-sm">
                  I understand and consent to data storage
                </Label>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex gap-2">
            {step === "details" && (
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
            )}
            <Button onClick={handleUpgrade} disabled={!canProceed() || isLoading} className="flex-1">
              {isLoading ? "Upgrading..." : "Upgrade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
