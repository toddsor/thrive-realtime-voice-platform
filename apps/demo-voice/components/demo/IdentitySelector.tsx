"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, UserCheck, UserX, ArrowRight, CheckCircle } from "lucide-react";
import { IdentityLevel } from "@thrivereflections/realtime-contracts";

interface IdentityOption {
  level: IdentityLevel;
  title: string;
  description: string;
  benefits: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeColor: "default" | "secondary" | "outline";
}

const identityOptions: IdentityOption[] = [
  {
    level: "ephemeral",
    title: "Ephemeral",
    description: "No data stored anywhere - maximum privacy",
    benefits: ["Complete privacy", "No data collection", "In-memory only"],
    icon: UserX,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    badgeColor: "secondary",
  },
  {
    level: "local",
    title: "Local Only",
    description: "Data stored only in your browser",
    benefits: ["Browser storage only", "No server data", "Offline capable"],
    icon: Shield,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    badgeColor: "default",
  },
  {
    level: "anonymous",
    title: "Anonymous",
    description: "Temporary server storage with anonymous ID",
    benefits: ["Cross-device access", "External tools", "14-day retention"],
    icon: User,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    badgeColor: "outline",
  },
  {
    level: "pseudonymous",
    title: "Pseudonymous",
    description: "Persistent profile with chosen nickname",
    benefits: ["Personalized experience", "90-day retention", "Community features"],
    icon: UserCheck,
    color: "bg-green-100 text-green-800 border-green-200",
    badgeColor: "default",
  },
];

interface IdentitySelectorProps {
  onSelect: (level: IdentityLevel) => void;
  currentLevel?: IdentityLevel;
}

export function IdentitySelector({ onSelect, currentLevel }: IdentitySelectorProps) {
  const [selectedLevel, setSelectedLevel] = useState<IdentityLevel | null>(currentLevel || null);
  const router = useRouter();

  const handleContinue = () => {
    if (selectedLevel) {
      onSelect(selectedLevel);
      router.push("/demo");
    }
  };

  const handleSkip = () => {
    // Default to ephemeral if no selection
    onSelect("ephemeral");
    router.push("/demo");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">Choose Your Privacy Level</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Select how you'd like your conversation data to be handled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {identityOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedLevel === option.level;
              
              return (
                <Card
                  key={option.level}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? "ring-2 ring-primary border-primary"
                      : "hover:border-primary/50"
                  } ${option.color}`}
                  onClick={() => setSelectedLevel(option.level)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6" />
                        <div>
                          <CardTitle className="text-lg">{option.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {option.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={option.badgeColor}>
                        {isSelected ? "Selected" : "Click to select"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {option.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              onClick={handleContinue}
              disabled={!selectedLevel}
              className="flex items-center gap-2"
            >
              Continue to Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex items-center gap-2"
            >
              Skip (Use Ephemeral)
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>You can change your privacy level at any time during the demo.</p>
            <p>Higher levels unlock more features but store more data.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
