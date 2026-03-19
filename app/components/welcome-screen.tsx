"use client";

import { useEffect, useState } from "react";

interface WelcomeScreenProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (text: string) => void;
  onUploadClick: () => void;
  disabled?: boolean;
  files?: FileList;
  onRemoveFile?: (index: number) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}

const SUGGESTED_QUESTIONS = [
  "丝柯克天赋要点普攻还是战技？",
  "德波小蛋糕改良型的材料是什么？",
  `博士周本的语音\u201c此为\u2026\u2026\u201d后面的内容是什么？`,
];

export function WelcomeScreen({
  input,
  onInputChange,
  onSubmit,
  onUploadClick,
  disabled,
  files,
  onRemoveFile,
  onPaste,
}: WelcomeScreenProps) {
  const [objectUrls, setObjectUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!files || files.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setObjectUrls([]);
      return;
    }
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setObjectUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center -translate-y-12">
      <h1 className="text-4xl font-bold mb-8 text-zinc-800 dark:text-zinc-200">
        我是原神糕手
      </h1>
      <form
        className="w-full max-w-2xl px-4 mb-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            onSubmit(input);
          }
        }}
      >
        <div
          className={`flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all ${
            files && files.length > 0
              ? "rounded-[32px] shadow-2xl p-2"
              : "rounded-[30px] shadow-2xl pl-3 pr-4"
          }`}
        >
          {/* 缩略图预览区（如果有图片） */}
          {files && files.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2 pt-2 pb-1">
              {objectUrls.map((url, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={files[i]?.name}
                    className="h-16 w-16 object-cover rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveFile?.(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-zinc-800/80 text-white text-xs leading-none hover:bg-zinc-800 transition-colors"
                    title="移除图片"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className={`flex items-center gap-2 ${
              files && files.length > 0 ? "pl-1 pr-2" : ""
            }`}
          >
            {/* + 按钮 */}
            <button
              type="button"
              onClick={onUploadClick}
              disabled={disabled}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-transparent text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-600 text-3xl font-light leading-none transition-colors"
              title="上传图片"
            >
              +
            </button>
            <input
              className={`flex-1 text-lg bg-transparent focus:outline-none font-sans min-w-0 ${
                files && files.length > 0
                  ? "py-2.5 text-left"
                  : "py-4 text-center"
              }`}
              value={input}
              placeholder="询问有关原神的一切..."
              onChange={(e) => onInputChange(e.currentTarget.value)}
              onPaste={onPaste}
            />
          </div>
        </div>
      </form>
      <div className="flex flex-wrap justify-center gap-3 max-w-2xl px-4">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSubmit(q)}
            className="px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-full transition-colors border border-zinc-200 dark:border-zinc-700"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
