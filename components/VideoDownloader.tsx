"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, X, Share2, Save, Link, Settings } from "lucide-react";

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
  const [apiProvider, setApiProvider] = useState<"primary" | "secondary">(
    "primary"
  );
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setDownloadHistory(getDownloadHistory());
  }, []);

  const handleDownload = async () => {
    if (!url || !isValidUrl(url)) {
      toast({
        title: "Error",
        description: "Please enter a valid TikTok or X.com video URL",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      // Detect mobile devices
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const filename = `video-${Date.now()}.mp4`;

      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          direct: isMobile, // Use direct download for mobile
          filename,
          apiProvider,
        }),
      });

      if (!response.ok) throw new Error("Download failed");

      let videoUrl, musicUrl, musicFilename;

      if (isMobile) {
        // Mobile handling - direct video download
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        if (isIOS) {
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

          toast({
            title: "Download Complete",
            description: "Video has been downloaded",
          });
        }

        // Get audio URL if available for optional download
        try {
          const infoResponse = await fetch("/api/video-info", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url,
              apiProvider,
            }),
          });

          if (infoResponse.ok) {
            const infoData = await infoResponse.json();
            musicUrl = infoData.musicUrl;
            musicFilename = infoData.musicFilename;

            // Log the audio URL for mobile
            if (musicUrl) {
              console.log("Mobile - Audio download URL:", musicUrl);
            } else {
              console.log("Mobile - No audio file available");
            }
          }
        } catch (error) {
          console.error("Error fetching audio info:", error);
        }
      } else {
        // Desktop handling
        const responseData = await response.json();
        videoUrl = responseData.url;
        musicUrl = responseData.musicUrl;
        const videoFilename = responseData.filename;
        musicFilename = responseData.musicFilename;

        // Log the URLs
        console.log("Video download URL:", videoUrl);
        if (musicUrl) {
          console.log("Audio download URL:", musicUrl);
        } else {
          console.log("No audio file available");
        }

        // Download video first and complete it
        try {
          const videoResponse = await fetch(videoUrl);
          const videoBlob = await videoResponse.blob();
          const videoBlobUrl = window.URL.createObjectURL(videoBlob);

          // Set the video URL to show the player
          setVideoUrl(videoBlobUrl);

          // Also create a download link
          const videoLink = document.createElement("a");
          videoLink.href = videoBlobUrl;
          videoLink.download = videoFilename;
          document.body.appendChild(videoLink);
          videoLink.click();
          document.body.removeChild(videoLink);

          // Clean up blob URL when video player is closed
          // This now happens in the X button click handler

          toast({
            title: "Download Complete",
            description: "Video has been downloaded and is ready to play",
          });

          // Add to download history
          const historyItem: DownloadHistoryItem = {
            id: Date.now(),
            url,
            filename: videoFilename,
            downloadedAt: new Date().toISOString(),
          };

          const history = JSON.parse(
            localStorage.getItem("downloadHistory") || "[]"
          );

          const newHistory = [historyItem, ...history];
          localStorage.setItem("downloadHistory", JSON.stringify(newHistory));
          setDownloadHistory(newHistory);

          // Only after video is downloaded, check for audio
          if (musicUrl) {
            // Use setTimeout to ensure this happens after the video download completes
            setTimeout(() => {
              const shouldDownloadAudio = window.confirm(
                "Audio file is also available. Would you like to download it?"
              );

              if (shouldDownloadAudio) {
                handleAudioDownload(musicUrl, musicFilename);
              }
            }, 1500); // Increase from 500ms to 1500ms
          }
        } catch (error) {
          console.error("Video download error:", error);
          toast({
            title: "Error",
            description: "Failed to download video",
            variant: "destructive",
          });
        }
      }
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

  const handleAudioDownload = async (
    audioUrl: string,
    audioFilename: string | null
  ) => {
    console.log("Starting audio download from:", audioUrl);

    // Skip m3u8 files entirely (Twitter audio streams)
    if (audioUrl.includes(".m3u8")) {
      toast({
        title: "Audio Not Available",
        description:
          "Direct audio download is not supported for this video format",
        duration: 5000,
      });
      return;
    }

    // Regular direct download for TikTok audio files
    try {
      const musicResponse = await fetch(audioUrl);
      const musicBlob = await musicResponse.blob();
      const musicBlobUrl = window.URL.createObjectURL(musicBlob);

      const musicLink = document.createElement("a");
      musicLink.href = musicBlobUrl;
      musicLink.download = audioFilename || `audio-${Date.now()}.mp3`;
      document.body.appendChild(musicLink);
      musicLink.click();
      document.body.removeChild(musicLink);

      // Clean up blob URL
      setTimeout(() => {
        window.URL.revokeObjectURL(musicBlobUrl);
      }, 100);

      toast({
        title: "Audio Downloaded",
        description: "Audio file has been downloaded",
      });
    } catch (error) {
      console.error("Failed to download audio:", error);
      toast({
        title: "Audio Download Failed",
        description: "Could not download the audio file",
        variant: "destructive",
      });
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

  // Add URL validation
  const isValidUrl = (url: string) => {
    return (
      url.includes("tiktok.com") ||
      url.includes("x.com") ||
      url.includes("twitter.com")
    );
  };

  // Add a function to clear the URL input
  const clearUrl = () => {
    setUrl("");
  };

  // Add toggle settings function
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto">
      {/* Input, Settings toggle, and Download Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          {/* Link icon on the left */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Link className="h-4 w-4" />
          </div>

          <Input
            type="url"
            inputMode="url"
            placeholder="Paste video URL (TikTok, X.com)"
            value={url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUrl(e.target.value)
            }
            className="w-full text-[16px] leading-[1.25] py-2 pl-9 pr-8"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          {/* X button to clear input - only shows when there's text */}
          {url && (
            <button
              type="button"
              onClick={clearUrl}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleSettings}
            className="flex-shrink-0"
            title="Download Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
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
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 p-3 rounded-lg border mb-2">
          <h3 className="font-medium mb-2 text-sm">Download Settings</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="api-primary"
                name="api-provider"
                checked={apiProvider === "primary"}
                onChange={() => setApiProvider("primary")}
                className="mr-2"
              />
              <label htmlFor="api-primary" className="text-sm">
                Primary API (Recommended)
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="api-secondary"
                name="api-provider"
                checked={apiProvider === "secondary"}
                onChange={() => setApiProvider("secondary")}
                className="mr-2"
              />
              <label htmlFor="api-secondary" className="text-sm">
                Secondary API (Fallback)
              </label>
            </div>
          </div>
        </div>
      )}

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
                className="p-3 bg-gray-100 rounded flex justify-between items-start"
              >
                <div className="flex-1 pr-3 overflow-hidden">
                  <p className="font-medium text-sm break-all line-clamp-2">
                    {item.url}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {item.filename}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(item.downloadedAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-red-500 flex-shrink-0"
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
