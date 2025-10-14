import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Thrive Realtime Voice Platform</CardTitle>
          <CardDescription className="text-gray-600">Demo Application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Experience real-time voice conversations with AI, complete with live captions, tool integration, and cost
            tracking.
          </p>
          <div className="space-y-2">
            <Link href="/demo" className="block">
              <Button className="w-full">Launch Voice Demo</Button>
            </Link>
            <p className="text-xs text-gray-500 text-center">Requires microphone access and OpenAI API key</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
