"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DemoSessionData, 
  CreateDemoSessionInput, 
  DemoAnalytics 
} from "@/lib/types/demo";

interface DemoSessionManagerProps {
  userId: string;
}

export function DemoSessionManager({ userId }: DemoSessionManagerProps) {
  const [sessions, setSessions] = useState<DemoSessionData[]>([]);
  const [analytics, setAnalytics] = useState<DemoAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSession, setNewSession] = useState<CreateDemoSessionInput>({
    userId,
    sessionName: "",
    demoType: "voice",
  });

  // Load sessions and analytics on mount
  useEffect(() => {
    loadSessions();
    loadAnalytics();
  }, [userId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/demo/sessions?userId=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSessions(data.sessions);
      } else {
        setError(data.error || "Failed to load sessions");
      }
    } catch (err) {
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/demo/analytics?userId=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
  };

  const createSession = async () => {
    if (!newSession.sessionName.trim()) {
      setError("Session name is required");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/demo/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSessions([data.session, ...sessions]);
        setNewSession({ userId, sessionName: "", demoType: "voice" });
        setError(null);
        loadAnalytics(); // Refresh analytics
      } else {
        setError(data.error || "Failed to create session");
      }
    } catch (err) {
      setError("Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: 'active' | 'completed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/demo/sessions?id=${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        loadSessions(); // Refresh sessions
        loadAnalytics(); // Refresh analytics
      }
    } catch (err) {
      console.error("Failed to update session:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDemoTypeColor = (type: string) => {
    switch (type) {
      case 'voice': return 'bg-purple-100 text-purple-800';
      case 'chat': return 'bg-orange-100 text-orange-800';
      case 'video': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Demo Session Manager</CardTitle>
          <CardDescription>
            Create and manage demo sessions using the extended Prisma client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sessionName">Session Name</Label>
              <Input
                id="sessionName"
                value={newSession.sessionName}
                onChange={(e) => setNewSession({ ...newSession, sessionName: e.target.value })}
                placeholder="Enter session name"
              />
            </div>
            <div>
              <Label htmlFor="demoType">Demo Type</Label>
              <select
                id="demoType"
                value={newSession.demoType}
                onChange={(e) => setNewSession({ ...newSession, demoType: e.target.value as any })}
                className="w-full p-2 border rounded-md"
              >
                <option value="voice">Voice</option>
                <option value="chat">Chat</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={createSession} disabled={loading}>
                {loading ? "Creating..." : "Create Session"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.totalSessions}</div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.completedSessions}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No sessions found</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{session.sessionName}</h3>
                      <p className="text-sm text-gray-600">
                        Created {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getDemoTypeColor(session.demoType)}>
                        {session.demoType}
                      </Badge>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {session.status === 'active' && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateSessionStatus(session.id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateSessionStatus(session.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
