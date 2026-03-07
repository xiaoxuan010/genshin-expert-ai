"use client";

import { useState } from "react";

interface ReasoningPartProps {
	text: string;
	state: "streaming" | "done";
	isFollowedByNewStep?: boolean;
}

export function ReasoningPart({
	text,
	state,
	isFollowedByNewStep,
}: ReasoningPartProps) {
	const isStreaming = state === "streaming";
	// userOverride: null = 跟随自动逻辑; true/false = 用户手动操作
	const [userOverride, setUserOverride] = useState<boolean | null>(null);
	// 流式中保持展开；后面出现新推理块或非空文本时（下一步正式开始）才折叠；用户手动操作优先
	const shouldBeOpen = isStreaming || !isFollowedByNewStep;
	const open = userOverride !== null ? userOverride : shouldBeOpen;
	const dimDot = !isStreaming && !open;

	return (
		<details
			className="group bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg my-2 font-mono"
			open={open}
			onToggle={(e) =>
				!isStreaming && setUserOverride(e.currentTarget.open)
			}
		>
			<summary className="flex items-center justify-between cursor-pointer list-none select-none p-3">
				<div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 select-none uppercase tracking-wider">
					<span
						className={`w-2 h-2 rounded-full transition-opacity ${
							isStreaming ? "animate-pulse" : ""
						} ${dimDot ? "opacity-30" : "opacity-100"}`}
						style={{ backgroundColor: "#60a5fa" }}
					/>
					Thinking Process
				</div>
				<div className="text-[10px] text-zinc-400 rotate-0 group-open:rotate-90 transition-transform">
					▶
				</div>
			</summary>
			<pre className="mx-3 mb-3 text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-mono overflow-x-auto leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3">
				{text}
			</pre>
		</details>
	);
}
