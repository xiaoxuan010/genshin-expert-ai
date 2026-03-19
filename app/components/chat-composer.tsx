"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePreviewStrip } from "./image-preview-strip";
import { WelcomeScreen } from "./welcome-screen";

interface ChatComposerProps {
  isInitialState: boolean;
  disabled: boolean;
  onSend: (text: string, files?: FileList) => void;
}

export function ChatComposer({
  isInitialState,
  disabled,
  onSend,
}: ChatComposerProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(
    (text: string) => {
      onSend(text, files);
      setInput("");
      setFiles(undefined);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [files, onSend],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const items = e.clipboardData.items;
      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        const dt = new DataTransfer();
        if (files) {
          Array.from(files).forEach((f) => dt.items.add(f));
        }
        pastedFiles.forEach((f) => dt.items.add(f));
        setFiles(dt.files);
        e.preventDefault();
      }
    },
    [files],
  );

  return (
    <>
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const dt = new DataTransfer();
            if (files && files.length > 0) {
              Array.from(files).forEach((f) => dt.items.add(f));
            }
            Array.from(e.target.files).forEach((f) => dt.items.add(f));
            setFiles(dt.files);
          }
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
      />

      {isInitialState ? (
        <WelcomeScreen
          input={input}
          onInputChange={setInput}
          onSubmit={handleSend}
          onUploadClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          files={files}
          onPaste={handlePaste}
          onRemoveFile={(index) => {
            const dt = new DataTransfer();
            if (files) {
              Array.from(files).forEach((f, i) => {
                if (i !== index) dt.items.add(f);
              });
            }
            const next = dt.files.length > 0 ? dt.files : undefined;
            setFiles(next);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const hasFiles = files && files.length > 0;
            if (input.trim() || hasFiles) handleSend(input);
          }}
        >
          {files && files.length > 0 && (
            <ImagePreviewStrip
              files={files}
              onRemove={(index: number) => {
                const dt = new DataTransfer();
                Array.from(files).forEach((f, i) => {
                  if (i !== index) dt.items.add(f);
                });
                const next = dt.files.length > 0 ? dt.files : undefined;
                setFiles(next);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
          )}

          <div className="fixed bg-white dark:bg-zinc-900 bottom-10 w-[calc(100%-2rem)] max-w-4xl border border-zinc-300 dark:border-zinc-800 rounded-full shadow-xl left-1/2 -translate-x-1/2 flex items-center gap-2 pl-2 pr-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-transparent text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-600 text-2xl font-light leading-none transition-colors"
              title="上传图片"
              disabled={disabled}
            >
              +
            </button>

            <input
              className="flex-1 bg-transparent py-3 focus:outline-none min-w-0"
              value={input}
              placeholder="继续追问..."
              onChange={(e) => setInput(e.currentTarget.value)}
              onPaste={handlePaste}
            />
          </div>

          <div className="fixed bottom-3 left-1/2 -translate-x-1/2 text-xs text-zinc-500 text-center w-full">
            人工智能生成的内容可能不准确。
          </div>
        </form>
      )}
    </>
  );
}
