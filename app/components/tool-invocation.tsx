"use client";

import { UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";

type MessagePart = UIMessage["parts"][number] & {
	toolInvocation?: {
		state?: string;
		args?: unknown;
		result?: unknown;
	};
};

const TOOL_DISPLAY_NAME: Record<string, string> = {
	"get-page": "获取页面",
	"search-page": "搜索页面",
	"get-date-time": "日期时间",
};

function isDateTimeOutput(output: unknown): output is {
	timeZone?: string;
	formatted?: string;
	iso?: string;
	unixMs?: number;
} {
	return typeof output === "object" && output !== null && !("error" in output);
}

export function ToolInvocation({
	part,
	isFollowedByNewStep,
}: {
	part: MessagePart;
	isFollowedByNewStep?: boolean;
}) {
	// 获取工具名称
	let toolName = "Unknown Tool";
	if ("toolName" in part) {
		toolName = (part as { toolName: string }).toolName;
	} else if (part.type.startsWith("tool-")) {
		toolName = part.type.slice(5);
	}
	const toolDisplayName = TOOL_DISPLAY_NAME[toolName];

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
	const open =
		userOverride !== null
			? userOverride
			: isRunning || !isFollowedByNewStep;

	const dimDot = isDone && !open;

	function handleToggle() {
		if (isDone) setUserOverride(!open);
	}

	// 用 ResizeObserver 追踪内容真实高度，使 height 过渡动画在流式更新时也生效
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentHeight, setContentHeight] = useState(0);
	useEffect(() => {
		const el = contentRef.current;
		if (!el) return;
		const observer = new ResizeObserver(() => {
			setContentHeight(el.scrollHeight);
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<div className="border border-zinc-200 dark:border-zinc-800 rounded-lg my-2 bg-zinc-50 dark:bg-zinc-900/50 text-sm font-mono">
			{/* 点击头部区域触发折叠 */}
			<div
				className={`flex items-center justify-between p-3 select-none ${isDone ? "cursor-pointer active:bg-zinc-100 dark:active:bg-zinc-900 rounded-lg transition-colors" : "cursor-default"}`}
				onClick={handleToggle}
			>
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
							Tool:{" "}
							{toolDisplayName
								? `${toolDisplayName} (${toolName})`
								: toolName}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="text-[10px] text-zinc-400 uppercase tracking-tighter bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
						{state}
					</div>
					<div
						className="text-[10px] text-zinc-400 transition-transform duration-250"
						style={{
							transform: open ? "rotate(90deg)" : "rotate(0deg)",
						}}
					>
						▶
					</div>
				</div>
			</div>

			{/* 折叠内容区：用显式像素高度 + transition 实现平滑动画，流式更新时高度变化也有动画 */}
			<div
				style={{
					height: open ? contentHeight : 0,
					overflow: "hidden",
					transition: "height 250ms ease",
				}}
			>
				<div ref={contentRef} style={{ display: "flow-root" }}>
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
								{toolName === "get-date-time" &&
								isDateTimeOutput(output) ? (
									<div className="text-zinc-600 dark:text-zinc-300 text-xs bg-green-50/30 dark:bg-green-950/20 p-2 rounded space-y-1">
										{output.formatted && (
											<div>当前时间：{output.formatted}</div>
										)}
										{output.timeZone && (
											<div>时区：{output.timeZone}</div>
										)}
										{output.iso && <div>ISO：{output.iso}</div>}
										{typeof output.unixMs === "number" && (
											<div>Unix(ms)：{output.unixMs}</div>
										)}
									</div>
								) : (
									<pre className="text-zinc-600 dark:text-zinc-300 max-h-60 overflow-y-auto whitespace-pre-wrap dark:scrollbar-thumb-zinc-700 scrollbar-thin scrollbar-thumb-zinc-300 text-xs bg-green-50/30 dark:bg-green-950/20 p-2 rounded">
										{JSON.stringify(output, null, 2)}
									</pre>
								)}
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
										((output as { error?: string })
											?.error ??
											"Unknown error")}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
