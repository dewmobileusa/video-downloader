"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface HistoryItem {
  id: number;
  url: string;
  downloadedAt: string;
}

export default function DownloadHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = JSON.parse(
      localStorage.getItem("downloadHistory") || "[]"
    );
    setHistory(savedHistory);
  }, []);

  const removeItem = (id: number) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem("downloadHistory", JSON.stringify(updatedHistory));
  };

  if (history.length === 0) {
    return <p className="text-gray-500">No download history yet</p>;
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div>
            <p className="text-sm font-medium truncate max-w-[500px]">
              {item.url}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(item.downloadedAt).toLocaleString()}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
