"use client";

import { useState, useRef, useEffect } from "react";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRealtimeVoice } from "@/lib/hooks/useRealtimeVoice";
import { defaultAgentConfig, getAgentConfigWithUser } from "@/lib/config/agentConfig";
import { Mic, MicOff, Phone, PhoneOff, TestTube, Copy, Download, History, Settings, LogOut, User } from "lucide-react";
import { PrivacyWarningDialog } from "@/components/ui/privacy-warning-dialog";
import { CostDisplay, LiveCostTracker } from "@thrive/realtime-ui-components";
import { createClient } from "@/lib/supabase/client";
import { SupabaseAuthProvider } from "@thrive/realtime-auth-supabase";
import { InjectableConsoleLogger } from "@thrive/realtime-observability";

export default function VoicePage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTestingTool, setIsTestingTool] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [user, setUser] = useState<{ sub: string; email?: string; name?: string; provider?: string } | null>(null);
  const [authProvider, setAuthProvider] = useState<SupabaseAuthProvider | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const {
    connectionStatus,
    isRecording,
    error,
    latencyMarks,
    transcripts,
    retrievalMetrics,
    sessionId,
    usageData,
    connect,
    disconnect,
    getTimingStats,
  } = useRealtimeVoice();

  // Initialize auth provider and get user
  useEffect(() => {
    const supabase = createClient();

    // Only initialize auth if Supabase is configured
    if (supabase) {
      const provider = new SupabaseAuthProvider({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        logger: new InjectableConsoleLogger(),
      });
      provider.setSupabaseClient(supabase);
      setAuthProvider(provider);

      // Get current user
      provider.getCurrentUser().then(setUser);
    } else {
      // No authentication configured - user remains null
      setUser(null);
      setAuthProvider(null);
    }
  }, []);

  const handleLogout = async () => {
    if (!authProvider) {
      // If no auth provider, just navigate to home/login
      router.push("/login");
      return;
    }

    try {
      await authProvider.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const configWithUser = await getAgentConfigWithUser();
      // Update memory setting based on user preference
      const configWithMemory = {
        ...configWithUser,
        featureFlags: {
          ...configWithUser.featureFlags,
          memory: memoryEnabled ? ("short" as const) : ("off" as const),
        },
      };
      await connect(configWithMemory, user || undefined);
      // Don't set isConnecting to false here - let the connection status handle it
    } catch (err) {
      console.error("Connection failed:", err);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  // Update isConnecting based on connection status
  useEffect(() => {
    if (connectionStatus === "connected" || connectionStatus === "error") {
      setIsConnecting(false);
    }
  }, [connectionStatus]);

  const handleTestEchoTool = async () => {
    if (connectionStatus !== "connected") return;

    setIsTestingTool(true);
    try {
      // This would trigger the AI to call the echo tool
      // For now, we'll just add a latency mark to show the test was initiated
      console.log("Test echo tool button clicked - AI should call the echo tool");
    } catch (err) {
      console.error("Test tool failed:", err);
    } finally {
      setIsTestingTool(false);
    }
  };

  const handleCopyTranscripts = async () => {
    if (transcripts.length === 0) return;

    const formattedText = transcripts.map((t) => `${t.role === "user" ? "You" : "AI"}: ${t.text}`).join("\n\n");

    try {
      await navigator.clipboard.writeText(formattedText);
      // You could add a toast notification here
      console.log("Transcripts copied to clipboard");
    } catch (err) {
      console.error("Failed to copy transcripts:", err);
    }
  };

  const handleDownloadTranscripts = () => {
    if (transcripts.length === 0) return;

    const formattedText = transcripts
      .map((t) => `[${new Date(t.timestamp).toLocaleString()}] ${t.role === "user" ? "You" : "AI"}: ${t.text}`)
      .join("\n\n");

    const blob = new Blob([formattedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voice-conversation-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMemoryToggle = async () => {
    if (!memoryEnabled) {
      setShowPrivacyDialog(true);
    } else {
      setMemoryEnabled(false);
      localStorage.setItem("voice-consent", "DECLINED");

      // Update user consent in database if authenticated
      // await updateUserConsent('DECLINED');
    }
  };

  const handlePrivacyAccept = async () => {
    setMemoryEnabled(true);
    localStorage.setItem("voice-consent", "ACCEPTED");

    // Update user consent in database if authenticated
    // await updateUserConsent('ACCEPTED');
  };

  const handlePrivacyDecline = () => {
    // Keep memory disabled
  };

  const getStatusVariant = () => {
    switch (connectionStatus) {
      case "connected":
        return "default";
      case "connecting":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Error";
      default:
        return "Disconnected";
    }
  };

  const timingStats = getTimingStats();

  // Load memory preference from localStorage
  useEffect(() => {
    const savedConsent = localStorage.getItem("voice-consent");
    if (savedConsent === "ACCEPTED") {
      setMemoryEnabled(true);
    }
  }, []);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (scrollContainerRef.current && transcripts.length > 0) {
      const container = scrollContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;

      if (isNearBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [transcripts]);

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      {/* Header with user info and logout */}
      <div className="flex items-center justify-between mb-8">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold mb-2">Voice Assistant</h1>
          <p className="text-muted-foreground">Real-time voice conversation with AI</p>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user.email || user.name || "User"}</span>
            </div>
          )}
          {authProvider && (
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {isRecording ? (
                      <Mic className="h-5 w-5 text-red-500" />
                    ) : (
                      <MicOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    Voice Status
                  </CardTitle>
                  <CardDescription>{isRecording ? "Listening..." : "Not listening"}</CardDescription>
                </div>
                <Badge variant={getStatusVariant()}>{getStatusText()}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                {connectionStatus === "disconnected" ? (
                  <Button onClick={handleConnect} disabled={isConnecting} className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {isConnecting ? "Connecting..." : "Connect"}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleDisconnect} variant="destructive" className="flex items-center gap-2">
                      <PhoneOff className="h-4 w-4" />
                      Disconnect
                    </Button>
                    <Button
                      onClick={handleTestEchoTool}
                      disabled={isTestingTool}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <TestTube className="h-4 w-4" />
                      {isTestingTool ? "Testing..." : "Test Echo Tool"}
                    </Button>
                  </div>
                )}
              </div>

              {timingStats.ttfa && (
                <div className="text-center text-sm text-muted-foreground">
                  Time to first audio: {timingStats.ttfa}ms
                </div>
              )}
            </CardContent>
          </Card>

          {defaultAgentConfig.featureFlags.captions !== "off" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Captions</CardTitle>
                    <CardDescription>Real-time transcription of the conversation</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyTranscripts}
                      disabled={transcripts.length === 0}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTranscripts}
                      disabled={transcripts.length === 0}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div ref={scrollContainerRef} className="h-64 overflow-y-auto border rounded-md p-3 bg-background">
                  {transcripts.length > 0 ? (
                    <div className="space-y-3">
                      {transcripts.map((transcript, index) => (
                        <div key={transcript.id || index} className="text-sm">
                          <div className="flex items-start gap-2">
                            <span
                              className={`font-medium text-xs px-2 py-1 rounded ${
                                transcript.role === "user"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              }`}
                            >
                              {transcript.role === "user" ? "You" : "AI"}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {new Date(transcript.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p
                            className={`mt-1 ${
                              transcript.type === "partial"
                                ? "italic text-muted-foreground"
                                : "text-foreground font-medium"
                            }`}
                          >
                            {transcript.text}
                          </p>
                          {transcript.usageData && transcript.type === "final" && (
                            <div className="mt-2 text-xs text-muted-foreground flex gap-4 flex-wrap">
                              {transcript.usageData.tokensInput && (
                                <span>Input: {transcript.usageData.tokensInput} tokens</span>
                              )}
                              {transcript.usageData.tokensOutput && (
                                <span>Output: {transcript.usageData.tokensOutput} tokens</span>
                              )}
                              {transcript.usageData.estimatedCost && (
                                <span>Message: ${transcript.usageData.estimatedCost.toFixed(6)}</span>
                              )}
                              {usageData && (
                                <span className="font-semibold">Total: ${usageData.estimatedCost.toFixed(6)}</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No conversation yet. Connect to start the voice chat.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Latency Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Real-time performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {timingStats.ttfa && (
                  <Badge variant="outline" className="px-3 py-1">
                    TTFA: {timingStats.ttfa}ms
                  </Badge>
                )}
                {timingStats.totalResponseTime && (
                  <Badge variant="outline" className="px-3 py-1">
                    Response: {timingStats.totalResponseTime}ms
                  </Badge>
                )}
                {latencyMarks.filter((m) => m.mark.includes("tool")).length > 0 && (
                  <Badge variant="outline" className="px-3 py-1">
                    Tool Calls: {latencyMarks.filter((m) => m.mark.includes("tool")).length}
                  </Badge>
                )}
                {transcripts.length > 0 && (
                  <Badge variant="outline" className="px-3 py-1">
                    Messages: {transcripts.length}
                  </Badge>
                )}
                {retrievalMetrics.totalRetrievals > 0 && (
                  <Badge variant="outline" className="px-3 py-1 text-blue-600">
                    Retrievals: {retrievalMetrics.totalRetrievals}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Memory Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Session Settings
              </CardTitle>
              <CardDescription>Control how your conversation data is stored</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Save session history</span>
                    {memoryEnabled && (
                      <Badge variant="outline" className="text-green-600">
                        Enabled
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {memoryEnabled
                      ? "Your conversations are being saved securely and will be auto-deleted after 360 days."
                      : "Your conversations are not being saved. Enable to persist session history."}
                  </p>
                </div>
                <Button
                  variant={memoryEnabled ? "destructive" : "default"}
                  onClick={handleMemoryToggle}
                  className="flex items-center gap-2"
                >
                  {memoryEnabled ? (
                    <>
                      <Settings className="h-4 w-4" />
                      Disable
                    </>
                  ) : (
                    <>
                      <History className="h-4 w-4" />
                      Enable
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="text-center text-sm text-muted-foreground">
            <p>Click Connect to start a voice conversation with the AI assistant.</p>
            <p>Make sure your microphone is enabled and working properly.</p>
          </div>
        </div>

        {/* Right Column - Cost Tracking */}
        <div className="lg:col-span-3 space-y-6">
          {/* Live Cost Tracker */}
          <LiveCostTracker usageData={usageData} isActive={connectionStatus === "connected"} />

          {/* Cost Display */}
          <CostDisplay />
        </div>
      </div>

      {/* Privacy Warning Dialog */}
      <PrivacyWarningDialog
        open={showPrivacyDialog}
        onOpenChange={setShowPrivacyDialog}
        onAccept={handlePrivacyAccept}
        onDecline={handlePrivacyDecline}
      />
    </div>
  );
}
