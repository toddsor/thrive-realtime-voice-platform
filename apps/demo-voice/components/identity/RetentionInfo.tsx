"use client";

import { useIdentity } from "@/lib/hooks/useIdentity";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Shield, Database, Trash2 } from "lucide-react";

const retentionConfig = {
  ephemeral: {
    icon: Shield,
    title: "No Data Storage",
    description: "Your conversation is not stored anywhere. Everything is processed in memory only.",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
  local: {
    icon: Database,
    title: "Local Storage Only",
    description: "Your data is stored only in your browser. It's never sent to our servers.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  anonymous: {
    icon: Clock,
    title: "14 Day Retention",
    description: "Your conversation data is stored on our servers and automatically deleted after 14 days.",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  pseudonymous: {
    icon: Clock,
    title: "90 Day Retention",
    description: "Your profile and conversation data is stored for 90 days before automatic deletion.",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  authenticated: {
    icon: Database,
    title: "Permanent Storage",
    description: "Your data is stored permanently and can be managed through your account settings.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
};

export function RetentionInfo() {
  const { level } = useIdentity();
  const config = retentionConfig[level];
  const Icon = config.icon;

  return (
    <Alert className={`${config.bgColor} border-0`}>
      <Icon className={`h-4 w-4 ${config.color}`} />
      <AlertDescription className={config.color}>
        <div className="font-medium mb-1">{config.title}</div>
        <div className="text-sm">{config.description}</div>
      </AlertDescription>
    </Alert>
  );
}
