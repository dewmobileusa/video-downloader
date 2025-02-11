"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, X, Share2, Save } from "lucide-react";

// Define interface for history items
interface DownloadHistoryItem {
  id: number;
  url: string;
  filename: string;
  downloadedAt: string;
}

export default function VideoDownloader() {
  const [url, setUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>(
    []
  );
  const { toast } = useToast();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  useEffect(() => {
    setDownloadHistory(getDownloadHistory());
  }, []);

  const handleDownload = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a valid video URL",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      // Detect mobile devices
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const filename = `tiktok-${Date.now()}.mp4`;

      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          direct: isMobile, // Use direct download for both iOS and Android
          filename,
        }),
      });

      if (!response.ok) throw new Error("Download failed");

      if (isMobile) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
          // For iOS: Show video in a modal/overlay with native controls
          setVideoUrl(blobUrl);
          toast({
            title: "Video Ready",
            description: "Tap and hold the video to save it to your device",
          });
        } else {
          // For Android: Use download link
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = filename;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        // Clean up blob URL after a delay
        setTimeout(() => {
          if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            window.URL.revokeObjectURL(blobUrl);
          }
        }, 100);
      } else {
        // Desktop handling remains the same
        const { url: videoUrl } = await response.json();
        setVideoUrl(videoUrl);

        const videoResponse = await fetch(videoUrl);
        const blob = await videoResponse.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(blobUrl);
      }

      // Save to history with filename
      const historyItem: DownloadHistoryItem = {
        id: Date.now(),
        url,
        filename,
        downloadedAt: new Date().toISOString(),
      };

      const history = JSON.parse(
        localStorage.getItem("downloadHistory") || "[]"
      );

      const newHistory = [historyItem, ...history];
      localStorage.setItem("downloadHistory", JSON.stringify(newHistory));
      setDownloadHistory(newHistory);

      toast({
        title: "Success",
        description: "Video downloaded successfully!",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download video",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getDownloadHistory = (): DownloadHistoryItem[] => {
    try {
      return JSON.parse(localStorage.getItem("downloadHistory") || "[]");
    } catch (error) {
      console.error("Error reading history:", error);
      return [];
    }
  };

  // Add context menu handling
  const handleLongPress = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setMenuPosition({
      x: touch.clientX,
      y: touch.clientY,
    });
    setShowContextMenu(true);
  };

  const handleDownloadFromPlayer = async () => {
    if (!videoUrl || !videoRef.current) return;

    try {
      if (isIOS) {
        // For iOS: Get video as blob and share
        const response = await fetch(videoUrl);
        const blob = await response.blob();

        // Create file object for sharing
        const file = new File([blob], `tiktok-${Date.now()}.mp4`, {
          type: "video/mp4",
        });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Save TikTok Video",
            text: "Download this TikTok video",
          });
        } else {
          // Fallback if file sharing is not supported
          await navigator.share({
            url: videoUrl,
            title: "Save TikTok Video",
            text: "Download this TikTok video",
          });
        }

        toast({
          title: "Share Options Opened",
          description: "Choose 'Save Video' to download to your gallery",
        });
      } else if (isAndroid) {
        // Android handling remains the same
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `tiktok-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
      setShowContextMenu(false);
    } catch (error) {
      console.error("Share/Download error:", error);
      toast({
        title: "Error",
        description: isIOS
          ? "Failed to open share options"
          : "Failed to download video",
        variant: "destructive",
      });
    }
  };

  // Add clearHistory function
  const clearHistory = () => {
    localStorage.removeItem("downloadHistory");
    setDownloadHistory([]);
    toast({
      title: "History Cleared",
      description: "Download history has been cleared",
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto">
      {/* Input and Download Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="url"
            inputMode="url"
            placeholder="Paste TikTok URL"
            value={url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUrl(e.target.value)
            }
            className="w-full text-[16px] leading-[1.25] py-2"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full sm:w-auto whitespace-nowrap"
        >
          {isDownloading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Downloading...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download
            </>
          )}
        </Button>
      </div>

      {/* Video Player */}
      {videoUrl && (
        <div
          className="rounded-lg overflow-hidden relative mx-auto bg-black w-full"
          style={{
            maxWidth: "min(100%, 400px)",
            height: "min(60vh, 600px)",
            minHeight: "250px",
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => {
              if (videoUrl.startsWith("blob:")) {
                window.URL.revokeObjectURL(videoUrl);
              }
              setVideoUrl(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
          <video
            ref={videoRef}
            controls
            className="w-full h-full object-contain"
            src={videoUrl}
            autoPlay
            playsInline
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            onTouchStart={handleLongPress}
            onTouchEnd={() => setTimeout(() => setShowContextMenu(false), 2000)}
          >
            Your browser does not support the video tag.
          </video>

          {/* Context Menu */}
          {showContextMenu && (
            <div
              className="absolute bg-white rounded-lg shadow-lg p-2 z-20"
              style={{
                top: menuPosition.y,
                left: menuPosition.x,
                transform: "translate(-50%, -50%)",
              }}
            >
              <Button
                variant="ghost"
                className="w-full flex items-center gap-2"
                onClick={handleDownloadFromPlayer}
              >
                {isIOS ? (
                  <>
                    <Share2 className="h-4 w-4" />
                    Share
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save to Device
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Download History */}
      <div className="mt-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Download History</h2>
          {downloadHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 text-sm"
              onClick={clearHistory}
            >
              Clear All
            </Button>
          )}
        </div>
        {downloadHistory.length === 0 ? (
          <p>No download history yet</p>
        ) : (
          <ul className="space-y-2">
            {downloadHistory.map((item) => (
              <li
                key={item.id}
                className="p-2 bg-gray-100 rounded flex justify-between items-start"
              >
                <div>
                  <p className="font-medium">{item.url}</p>
                  <p className="text-sm text-gray-600">{item.filename}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(item.downloadedAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-red-500"
                  onClick={() => {
                    const newHistory = downloadHistory.filter(
                      (h) => h.id !== item.id
                    );
                    localStorage.setItem(
                      "downloadHistory",
                      JSON.stringify(newHistory)
                    );
                    setDownloadHistory(newHistory);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
