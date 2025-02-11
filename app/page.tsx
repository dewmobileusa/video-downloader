"use client";

import VideoDownloader from "@/components/VideoDownloader";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
          TikTok Video Downloader
        </h1>
        <VideoDownloader />
        <Toaster />
      </div>
    </main>
  );
}
