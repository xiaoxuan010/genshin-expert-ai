"use client";

import { UIMessage } from "ai";
import { useState } from "react";

type MessagePart = UIMessage["parts"][number] & {
	toolInvocation?: {
		state?: string;
		args?: unknown;
		result?: unknown;
	};
};

export function ToolInvocation({ part }: { part: MessagePart }) {
	// 获取工具名称
	let toolName = "Unknown Tool";
	if ("toolName" in part) {
		toolName = (part as { toolName: string }).toolName;
	} else if (part.type.startsWith("tool-")) {
		toolName = part.type.slice(5);
	}

	// 获取当前状态和数据
	const state =
		"state" in part
			? (part as { state: string }).state
			: part.toolInvocation?.state;
	const input =
		"input" in part
			? (part as { input: unknown }).input
			: part.toolInvocation?.args;
	const output =
		"output" in part
			? (part as { output: unknown }).output
			: part.toolInvocation?.result;
	const errorText =
		"errorText" in part
			? (part as { errorText: string }).errorText
			: undefined;

	const isRunning =
		state === "input-streaming" ||
		state === "input-available" ||
		state === "call";
	const isDone =
		state === "output-available" ||
		state === "output-error" ||
		state === "result";

	// 受控折叠状态：用于在完成且收起时变暗圆点（必须在 early return 之前调用）
	// userOverride: null = 跟随自动逻辑; true/false = 用户手动操作
	const [userOverride, setUserOverride] = useState<boolean | null>(null);
	// 运行中自动展开；结束后收起；用户手动操作优先
	const open = userOverride !== null ? userOverride : isRunning;

	const dimDot = isDone && !open;

	return (
		<details
			className="group border border-zinc-200 dark:border-zinc-800 rounded-lg my-2 bg-zinc-50 dark:bg-zinc-900/50 text-sm font-mono transition-colors"
			open={open}
			onToggle={(e) => isDone && setUserOverride(e.currentTarget.open)}
		>
			<summary className="flex items-center justify-between cursor-pointer list-none select-none p-3 active:bg-zinc-100 dark:active:bg-zinc-900 rounded-lg">
				<div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
					<div className="flex items-center gap-1.5">
						<span
							className={`w-2 h-2 rounded-full transition-opacity ${
								isRunning ? "animate-pulse" : ""
							} ${dimDot ? "opacity-30" : "opacity-100"}`}
							style={{
								backgroundColor:
									state === "output-error"
										? "#ef4444"
										: "#fbbf24",
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

			<div className="mx-3 mb-3 space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
				{/* Input Section */}
				{input !== undefined && (
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
				{(output || state === "result") && (
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
				{(errorText || state === "output-error") && (
					<div className="border-t border-red-100 dark:border-red-900/30 pt-3">
						<div className="text-[10px] font-bold text-red-600/70 mb-1 uppercase tracking-tight">
							Error
						</div>
						<div className="text-red-500 bg-red-50/50 dark:bg-red-950/20 p-2 rounded border border-red-100/50 dark:border-red-900/20 text-xs">
							{errorText ||
								((output as { error?: string })?.error ??
									"Unknown error")}
						</div>
					</div>
				)}
			</div>
		</details>
	);
}
