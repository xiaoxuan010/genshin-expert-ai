"use client";

import { UIMessage } from "ai";
import { useState } from "react";

type MessagePart = UIMessage["parts"][number];

export function ToolInvocation({ part }: { part: MessagePart }) {
  // 获取工具名称
  // 在 AI SDK 中，part.type 可能是 `tool-get-weather` 或者是 `dynamic-tool` 且包含 toolName
  let toolName = "Unknown Tool";
  if ("toolName" in part) {
    toolName = (part as unknown as { toolName: string }).toolName;
  } else if (part.type.startsWith("tool-")) {
    toolName = part.type.slice(5);
  }

  // 获取当前状态和数据
  const state =
    "state" in part ? (part as unknown as { state: string }).state : undefined;
  const input =
    "input" in part ? (part as unknown as { input: unknown }).input : undefined;
  const output =
    "output" in part
      ? (part as unknown as { output: unknown }).output
      : undefined;
  const errorText =
    "errorText" in part
      ? (part as unknown as { errorText: string }).errorText
      : undefined;

  const isRunning = state === "input-streaming" || state === "input-available";
  const isDone = state === "output-available" || state === "output-error";

  // 受控折叠状态：用于在完成且收起时变暗圆点（必须在 early return 之前调用）
  const [open, setOpen] = useState(!!isRunning);

  // 类型守卫：简单的 Tool 判定 (非 text/reasoning)
  if (part.type === "text" || part.type === "reasoning") return null;
  if (!state) return null;
  const dimDot = isDone && !open;

  return (
    <details
      className="group border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 my-2 bg-zinc-50 dark:bg-zinc-900/50 text-sm font-mono active:bg-zinc-100 dark:active:bg-zinc-900 transition-colors"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="flex items-center justify-between cursor-pointer list-none select-none">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full transition-opacity ${
                isRunning ? "animate-pulse" : ""
              } ${dimDot ? "opacity-30" : "opacity-100"}`}
              style={{
                backgroundColor:
                  state === "output-error" ? "#ef4444" : "#fbbf24",
              }}
            />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Tool: {toolName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] text-zinc-400 uppercase tracking-tighter bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
            {state}
          </div>
          <div className="text-[10px] text-zinc-400 rotate-0 group-open:rotate-90 transition-transform">
            ▶
          </div>
        </div>
      </summary>

      <div className="mt-4 space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
        {/* Input Section */}
        {(state === "input-streaming" ||
          state === "input-available" ||
          state === "output-available" ||
          state === "output-error") && (
          <div>
            <div className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-tight">
              Input
            </div>
            <pre className="bg-white dark:bg-zinc-950 p-2 rounded border border-zinc-100 dark:border-zinc-900/50 overflow-x-auto whitespace-pre-wrap word-break-break-all text-xs text-zinc-600 dark:text-zinc-400">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
        )}

        {/* Output Section */}
        {state === "output-available" && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <div className="text-[10px] font-bold text-green-600/70 dark:text-green-400/70 mb-1 uppercase tracking-tight">
              Result
            </div>
            <pre className="text-zinc-600 dark:text-zinc-300 max-h-60 overflow-y-auto whitespace-pre-wrap dark:scrollbar-thumb-zinc-700 scrollbar-thin scrollbar-thumb-zinc-300 text-xs bg-green-50/30 dark:bg-green-950/20 p-2 rounded">
              {JSON.stringify(output, null, 2)}
            </pre>
          </div>
        )}

        {/* Error Section */}
        {state === "output-error" && (
          <div className="border-t border-red-100 dark:border-red-900/30 pt-3">
            <div className="text-[10px] font-bold text-red-600/70 mb-1 uppercase tracking-tight">
              Error
            </div>
            <div className="text-red-500 bg-red-50/50 dark:bg-red-950/20 p-2 rounded border border-red-100/50 dark:border-red-900/20 text-xs">
              {errorText || "Unknown error"}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
