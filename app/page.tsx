"use client";

import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ContinuationPrompt } from "./components/continuation-prompt";
import { ImagePreviewStrip } from "./components/image-preview-strip";
import { MessagePart } from "./components/message-part";
import { WelcomeScreen } from "./components/welcome-screen";

export default function Chat() {
	const [input, setInput] = useState("");
	const [files, setFiles] = useState<FileList | undefined>(undefined);
	const fileInputRef = useRef<HTMLInputElement>(null);
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
		sendMessage({ text, files });
		setInput("");
		setFiles(undefined);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	return (
		<div className="flex flex-col min-h-screen w-full max-w-4xl mx-auto px-4 stretch">
			{/* 全局隐藏文件 input，欢迎页和对话页共用 */}
			<input
				type="file"
				accept="image/*"
				multiple
				className="hidden"
				ref={fileInputRef}
				onChange={(e) => {
					if (e.target.files && e.target.files.length > 0) {
						const dt = new DataTransfer();
						// 将原本已有的图片加上
						if (files && files.length > 0) {
							Array.from(files).forEach((f) => dt.items.add(f));
						}
						// 将新选的图片加上
						Array.from(e.target.files).forEach((f) => dt.items.add(f));
						// 通过 DataTransfer 形成一个与原 input 断开引用的全新 FileList，避免清空 input.value 时受影响
						setFiles(dt.files);
					}
					// 清空 input 值，允许重复选择相同文件
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
					disabled={status !== "ready"}
					files={files}
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
											isFollowedByNewStep={isFollowedByNewStep}
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
							const hasFiles = files && files.length > 0;
							if (input.trim() || hasFiles) handleSend(input);
						}}
					>
						{/* 图片预览条 */}
						{files && files.length > 0 && (
							<ImagePreviewStrip
								files={files}
								onRemove={(index: number) => {
									const dt = new DataTransfer();
									Array.from(files).forEach((f, i) => {
										if (i !== index) dt.items.add(f);
									});
									const next =
										dt.files.length > 0
											? dt.files
											: undefined;
									setFiles(next);
									if (fileInputRef.current)
										fileInputRef.current.value = "";
								}}
							/>
						)}

						{/* 输入行 */}
						<div className="fixed bg-white dark:bg-zinc-900 bottom-10 w-[calc(100%-2rem)] max-w-4xl border border-zinc-300 dark:border-zinc-800 rounded-full shadow-xl left-1/2 -translate-x-1/2 flex items-center gap-2 pl-2 pr-3">
							{/* + 按钮 */}
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-transparent text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-600 text-2xl font-light leading-none transition-colors"
								title="上传图片"
								disabled={status !== "ready"}
							>
								+
							</button>

							{/* 隐藏的文件 input */}
							<input
								type="file"
								accept="image/*"
								multiple
								className="hidden"
								ref={fileInputRef}
								onChange={(e) => {
									if (
										e.target.files &&
										e.target.files.length > 0
									) {
										setFiles(e.target.files);
									}
								}}
							/>

							{/* 文字输入 */}
							<input
								className="flex-1 bg-transparent py-3 focus:outline-none min-w-0"
								value={input}
								placeholder="继续追问..."
								onChange={(e) =>
									setInput(e.currentTarget.value)
								}
							/>
						</div>

						<div className="fixed bottom-3 left-1/2 -translate-x-1/2 text-xs text-zinc-500 text-center w-full">
							人工智能生成的内容可能不准确。
						</div>
					</form>
				</>
			)}
		</div>
	);
}
