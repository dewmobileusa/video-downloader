"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import LoginPanel from "@/components/LoginPanel";

interface VideoBrowserProps {
  platform: "x" | "tiktok";
}

export default function VideoBrowser({ platform }: VideoBrowserProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [embedHtml, setEmbedHtml] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load platform SDK
  useEffect(() => {
    if (platform === "x") {
      // Load Twitter widgets
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      // Load TikTok embed script
      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [platform]);

  const handleSearch = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a video URL",
        variant: "destructive",
      });
      return;
    }

    // Validate URL based on platform
    const isValidUrl =
      platform === "x"
        ? url.includes("x.com") || url.includes("twitter.com")
        : url.includes("tiktok.com");

    if (!isValidUrl) {
      toast({
        title: "Error",
        description: `Please enter a valid ${
          platform === "x" ? "X.com" : "TikTok"
        } video URL`,
        variant: "destructive",
      });
      return;
    }

    // Create embed HTML
    if (platform === "x") {
      setEmbedHtml(`
        <blockquote class="twitter-tweet">
          <a href="${url}">Loading tweet...</a>
        </blockquote>
      `);
    } else {
      setEmbedHtml(`
        <blockquote class="tiktok-embed">
          <a href="${url}">Loading TikTok...</a>
        </blockquote>
      `);
    }

    // Reload widgets
    if (platform === "x" && window.twttr) {
      window.twttr.widgets.load();
    } else if (platform === "tiktok" && window.tiktok) {
      window.tiktok.widgets.load();
    }
  };

  const handleDownload = async () => {
    if (!url) return;

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          platform,
        }),
      });

      if (!response.ok) throw new Error("Download failed");

      // Add to history
      const historyItem = {
        id: Date.now(),
        url,
        filename: `${platform}-video-${Date.now()}.mp4`,
        downloadedAt: new Date().toISOString(),
      };

      const history = JSON.parse(
        localStorage.getItem("downloadHistory") || "[]"
      );
      localStorage.setItem(
        "downloadHistory",
        JSON.stringify([historyItem, ...history])
      );

      toast({
        title: "Success",
        description: "Video added to download history",
      });

      // Handle download
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = historyItem.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download video",
        variant: "destructive",
      });
    }
  };

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
    toast({
      title: "Success",
      description: "Logged in successfully",
    });
  };

  const handleLoginCancel = () => {
    setShowLogin(false);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">
            {platform === "x" ? "X.com" : "TikTok"} Video Browser
          </h1>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-6">
          <Input
            type="url"
            placeholder={`Paste ${
              platform === "x" ? "X.com" : "TikTok"
            } video URL`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          {url && (
            <Button
              onClick={handleDownload}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>

        {/* Content Display */}
        {embedHtml ? (
          <div
            className="bg-white rounded-lg shadow-lg p-4"
            dangerouslySetInnerHTML={{ __html: embedHtml }}
          />
        ) : // Landing Page Content
        !showLogin ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-8">
              <Image
                src={platform === "x" ? "/x-logo.png" : "/tiktok-logo.png"}
                alt={platform === "x" ? "X.com" : "TikTok"}
                width={80}
                height={80}
                className="mx-auto mb-4"
              />
              <h2 className="text-2xl font-bold mb-2">
                Download {platform === "x" ? "X" : "TikTok"} Videos
              </h2>
              <p className="text-gray-600 mb-4">
                Paste a{platform === "x" ? "n X.com" : " TikTok"} video URL
                above to get started
              </p>

              {/* Add Login Button */}
              <Button
                variant="outline"
                onClick={handleLoginClick}
                className="mb-8"
              >
                Log in to {platform === "x" ? "X.com" : "TikTok"}
              </Button>
            </div>

            <div className="grid gap-4 max-w-lg mx-auto text-left">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">How to get video URL</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  {platform === "x" ? (
                    <>
                      <li>
                        Open X.com and find the video you want to download
                      </li>
                      <li>Click the share button (arrow icon)</li>
                      <li>Click "Copy link"</li>
                      <li>Paste the URL in the input field above</li>
                    </>
                  ) : (
                    <>
                      <li>
                        Open TikTok and find the video you want to download
                      </li>
                      <li>Click the share button (arrow icon)</li>
                      <li>Click "Copy link"</li>
                      <li>Paste the URL in the input field above</li>
                    </>
                  )}
                </ol>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Example URLs</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  {platform === "x" ? (
                    <>
                      <p>https://x.com/username/status/123456789</p>
                      <p>https://twitter.com/username/status/123456789</p>
                    </>
                  ) : (
                    <>
                      <p>https://www.tiktok.com/@username/video/123456789</p>
                      <p>https://vm.tiktok.com/123456789</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <LoginPanel
            platform={platform}
            onLogin={handleLoginSuccess}
            onCancel={handleLoginCancel}
          />
        )}

        {/* Logged-in Home Page View */}
        {isLoggedIn && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
            <div className="text-center py-8">
              <h3 className="text-xl font-semibold mb-2">
                Welcome to {platform === "x" ? "X.com" : "TikTok"}
              </h3>
              <p className="text-gray-600 mb-4">
                You're logged in! For security reasons, we can't display the
                actual feed.
              </p>
              <Button variant="outline" onClick={() => setIsLoggedIn(false)}>
                Log Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
