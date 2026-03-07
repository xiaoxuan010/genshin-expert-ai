"use client";

import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ContinuationPrompt } from "./components/continuation-prompt";
import { MessagePart } from "./components/message-part";
import { WelcomeScreen } from "./components/welcome-screen";

export default function Chat() {
	const [input, setInput] = useState("");
	const { messages, sendMessage, status } = useChat();

	// ── 智能自动滚动 ──────────────────────────────────────────────
	const bottomRef = useRef<HTMLDivElement>(null);
	// 是否处于"跟随末尾"模式（默认开启）
	const isFollowing = useRef(true);
	// 标记当前是程序触发的滚动，用于避免 onScroll 误判为用户上滚
	const isProgrammatic = useRef(false);

	const scrollToBottom = useCallback(() => {
		isProgrammatic.current = true;
		bottomRef.current?.scrollIntoView({ behavior: "instant" });
		// instant 滚动同步完成，短暂延迟后重置标志，应对 reflow 边缘情况
		setTimeout(() => {
			isProgrammatic.current = false;
		}, 50);
	}, []);

	// 监听用户滚动，更新跟随状态
	useEffect(() => {
		let lastScrollY = window.scrollY;
		function onScroll() {
			if (isProgrammatic.current) return;
			const currentScrollY = window.scrollY;
			const scrolledUp = currentScrollY < lastScrollY;
			lastScrollY = currentScrollY;

			const distanceFromBottom =
				document.documentElement.scrollHeight -
				currentScrollY -
				window.innerHeight;

			if (scrolledUp) {
				// 任何向上滚动立即停止跟随
				isFollowing.current = false;
			} else if (distanceFromBottom < 80) {
				// 向下滚到距底部 80px 内恢复跟随
				isFollowing.current = true;
			}
		}
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	// 当消息或流式状态变化时，若处于跟随模式则自动滚动到底部
	useEffect(() => {
		if (isFollowing.current) scrollToBottom();
	}, [messages, status, scrollToBottom]);
	// ─────────────────────────────────────────────────────────────

	const isInitialState = messages.length === 0;

	// 检测 AI 是否因达到步数上限而被截断（有工具调用但无文本输出）
	const lastMessage = messages[messages.length - 1];
	const needsContinuation =
		status === "ready" &&
		lastMessage?.role === "assistant" &&
		messages.length > 0 &&
		(() => {
			const parts = lastMessage.parts ?? [];
			const hasToolParts = parts.some(
				(p) => "toolName" in p || p.type.startsWith("tool-"),
			);
			const hasTextContent = parts.some(
				(p) =>
					p.type === "text" &&
					(p as { type: "text"; text: string }).text.trim(),
			);
			return hasToolParts && !hasTextContent;
		})();

	function handleSend(text: string) {
		isFollowing.current = true; // 每次发送都重置为跟随模式
		sendMessage({ text });
		setInput("");
	}

	return (
		<div className="flex flex-col min-h-screen w-full max-w-4xl mx-auto px-4 stretch">
			{isInitialState ? (
				<WelcomeScreen
					input={input}
					onInputChange={setInput}
					onSubmit={handleSend}
				/>
			) : (
				<>
					<div className="py-24">
						{messages.map((message) => (
							<div key={message.id} className="mb-4">
								<div className="font-bold mb-2">
									{message.role === "user"
										? "User: "
										: "AI: "}
								</div>
								{message.parts?.map((part, i) => {
									// 只要后面还有后续内容，当前块即可折叠
									const isFollowedByNewStep =
										i < (message.parts?.length ?? 0) - 1;
									return (
										<MessagePart
											key={`${message.id}-${i}`}
											part={part}
											id={`${message.id}-${i}`}
											isFollowedByNewStep={
												isFollowedByNewStep
											}
										/>
									);
								})}
							</div>
						))}

						{needsContinuation && (
							<ContinuationPrompt
								onContinue={() =>
									handleSend("请继续搜索，补充完善答案。")
								}
								onFinish={() =>
									handleSend(
										"无需继续搜索，请基于已有信息直接整理并给出最终答案。",
									)
								}
							/>
						)}
						{/* 底部哨兵：用于自动滚动定位 */}
						<div ref={bottomRef} />
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (input.trim()) handleSend(input);
						}}
					>
						<input
							className="fixed dark:bg-zinc-900 bottom-10 w-[calc(100%-2rem)] max-w-4xl p-3 border border-zinc-300 dark:border-zinc-800 rounded-xl shadow-xl left-1/2 -translate-x-1/2 focus:outline-none"
							value={input}
							placeholder={
								isInitialState
									? "询问有关原神的一切..."
									: "继续追问..."
							}
							onChange={(e) => setInput(e.currentTarget.value)}
						/>
						<div className="fixed bottom-3 left-1/2 -translate-x-1/2 text-xs text-zinc-500 text-center w-full">
							人工智能生成的内容可能不准确。
						</div>
					</form>
				</>
			)}
		</div>
	);
}
