"use client";

import { useIdentity } from "@/lib/hooks/useIdentity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shield, User, UserCheck, UserX, ChevronDown, Info } from "lucide-react";

const identityConfig = {
  ephemeral: {
    label: "Ephemeral",
    description: "No data stored",
    icon: UserX,
    color: "bg-gray-100 text-gray-800",
    badgeColor: "secondary" as const,
  },
  local: {
    label: "Local Only",
    description: "Stored in browser",
    icon: Shield,
    color: "bg-blue-100 text-blue-800",
    badgeColor: "default" as const,
  },
  anonymous: {
    label: "Anonymous",
    description: "Temporary server storage",
    icon: User,
    color: "bg-yellow-100 text-yellow-800",
    badgeColor: "outline" as const,
  },
  pseudonymous: {
    label: "Pseudonymous",
    description: "Persistent profile",
    icon: UserCheck,
    color: "bg-green-100 text-green-800",
    badgeColor: "default" as const,
  },
  authenticated: {
    label: "Authenticated",
    description: "Full account access",
    icon: UserCheck,
    color: "bg-purple-100 text-purple-800",
    badgeColor: "default" as const,
  },
};

export function IdentityBadge() {
  const { level, isLoading } = useIdentity();
  const config = identityConfig[level];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.badgeColor} className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isLoading}>
            <Info className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4" />
              <span className="font-medium">{config.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
