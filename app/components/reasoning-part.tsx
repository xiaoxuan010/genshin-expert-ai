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

	// ── 标题提取逻辑 ──────────────────────────────────────────────
	// 先检查是否以 Markdown 加粗格式开始的一行文本
	// 匹配正则表达式: 开头为 **...** 且直到行尾
	const titleMatch = text.match(/^\s*\*\*(.*?)\*\*\s*(\n|$)/);
	const customTitle = titleMatch ? titleMatch[1].trim() : null;
	// 如果匹配到了自定义标题，则实际内容应裁掉第一行
	const displayContent =
		customTitle && titleMatch ? text.slice(titleMatch[0].length).trim() : text;
	// ─────────────────────────────────────────────────────────────

	// userOverride: null = 跟随自动逻辑; true/false = 用户手动操作
	const [userOverride, setUserOverride] = useState<boolean | null>(null);
	// 流式中保持展开；后面出现新推理块或非空文本时（下一步正式开始）才折叠；用户手动操作优先
	const shouldBeOpen = isStreaming || !isFollowedByNewStep;
	const open = userOverride !== null ? userOverride : shouldBeOpen;
	const dimDot = !isStreaming && !open;

	function handleToggle() {
		if (!isStreaming) setUserOverride(!open);
	}

	return (
		<div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg my-2 font-mono">
			{/* 点击头部区域触发折叠 */}
			<div
				className="flex items-center justify-between p-3 cursor-pointer select-none"
				onClick={handleToggle}
			>
				<div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
					<span
						className={`w-2 h-2 rounded-full transition-opacity ${
							isStreaming ? "animate-pulse" : ""
						} ${dimDot ? "opacity-30" : "opacity-100"}`}
						style={{ backgroundColor: "#60a5fa" }}
					/>
					{customTitle || "Thinking Process"}
				</div>
				<div
					className="text-[10px] text-zinc-400 transition-transform duration-250"
					style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
				>
					▶
				</div>
			</div>
			{/* 折叠内容区：grid trick 实现平滑动画 */}
			<div
				style={{
					display: "grid",
					gridTemplateRows: open ? "1fr" : "0fr",
					transition: "grid-template-rows 250ms ease",
				}}
			>
				<div className="overflow-hidden">
					<pre className="mx-3 mb-3 text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-mono overflow-x-auto leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3">
						{displayContent}
					</pre>
				</div>
			</div>
		</div>
	);
}
