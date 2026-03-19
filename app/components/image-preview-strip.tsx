"use client";

import { useEffect, useState } from "react";

interface ImagePreviewStripProps {
  files: FileList;
  onRemove: (index: number) => void;
}

export function ImagePreviewStrip({ files, onRemove }: ImagePreviewStripProps) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const objectUrls = Array.from(files).map((f) => URL.createObjectURL(f));
    // eslint-disable-next-line
    setUrls(objectUrls);
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  if (urls.length === 0) return null;

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl flex flex-wrap gap-2 px-1 pointer-events-none">
      {urls.map((url, i) => (
        <div key={i} className="relative pointer-events-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={files[i]?.name}
            className="h-16 w-16 object-cover rounded-lg border border-zinc-300 dark:border-zinc-700 shadow"
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-zinc-800 text-white text-xs leading-none hover:bg-zinc-600 transition-colors"
            title="移除图片"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
