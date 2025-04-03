// This file should be deleted

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Lock, User } from "lucide-react";

interface LoginPanelProps {
  platform: "x" | "tiktok";
  onLogin: () => void;
  onCancel: () => void;
}

export default function LoginPanel({
  platform,
  onLogin,
  onCancel,
}: LoginPanelProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Here you would typically make an API call to authenticate
    // For demo purposes, we'll just show a message
    toast({
      title: "Login Notice",
      description:
        "This is a demo. Actual login functionality is not implemented.",
      variant: "destructive",
    });

    onLogin();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Log in to {platform === "x" ? "X.com" : "TikTok"}
      </h2>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <div className="flex items-center border rounded-lg p-2">
            <User className="w-5 h-5 text-gray-400 mr-2" />
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center border rounded-lg p-2">
            <Lock className="w-5 h-5 text-gray-400 mr-2" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Log In
          </Button>
        </div>
      </form>
    </div>
  );
}
