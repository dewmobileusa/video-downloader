"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function PlatformIcons() {
  const router = useRouter();

  return (
    <div className="flex gap-4 justify-center mt-2">
      <Button
        variant="ghost"
        className="p-2 hover:bg-gray-100 rounded-full"
        onClick={() => router.push("/x-viewer")}
      >
        <Image
          src="/x-logo.png"
          alt="X.com"
          width={24}
          height={24}
          className="dark:invert"
        />
      </Button>
      <Button
        variant="ghost"
        className="p-2 hover:bg-gray-100 rounded-full"
        onClick={() => router.push("/tiktok-viewer")}
      >
        <Image
          src="/tiktok-logo.png"
          alt="TikTok"
          width={24}
          height={24}
          className="dark:invert"
        />
      </Button>
    </div>
  );
}
