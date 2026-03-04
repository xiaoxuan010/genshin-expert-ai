"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ToolInvocation } from "./components/tool-invocation";

export default function Chat() {
	const [input, setInput] = useState("");
	const { messages, sendMessage } = useChat();

	const isInitialState = messages.length === 0;

	const suggestedQuestions = [
		"丝柯克天赋要点普攻还是战技？",
		"德波小蛋糕改良型的材料是什么？",
		"博士周本的语音“此为……”后面的内容是什么？",
	];

	return (
		<div className="flex flex-col min-h-screen w-full max-w-4xl mx-auto px-4 stretch">
			{isInitialState ? (
				<div className="flex-1 flex flex-col items-center justify-center -translate-y-12">
					<h1 className="text-4xl font-bold mb-8 text-zinc-800 dark:text-zinc-200">
						我是原神糕手
					</h1>
					<form
						className="w-full max-w-2xl px-4 mb-8"
						onSubmit={(e) => {
							e.preventDefault();
							if (input.trim()) {
								sendMessage({ text: input });
								setInput("");
							}
						}}
					>
						<input
							className="w-full p-4 text-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans text-center"
							value={input}
							placeholder="询问有关原神的一切..."
							onChange={(e) => setInput(e.currentTarget.value)}
						/>
					</form>
					<div className="flex flex-wrap justify-center gap-3 max-w-2xl px-4">
						{suggestedQuestions.map((q) => (
							<button
								key={q}
								onClick={() => {
									sendMessage({ text: q });
								}}
								className="px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-full transition-colors border border-zinc-200 dark:border-zinc-700"
							>
								{q}
							</button>
						))}
					</div>
				</div>
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
									switch (part.type) {
										case "text":
											return (
												<div
													key={`${message.id}-${i}`}
													className="prose dark:prose-invert max-w-none"
												>
													<Markdown
														remarkPlugins={[
															remarkGfm,
														]}
													>
														{part.text}
													</Markdown>
												</div>
											);
										case "reasoning":
											return (
												<details
													key={`${message.id}-${i}`}
													className="group bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg my-2 font-mono"
													open={
														part.state ===
														"streaming"
													}
												>
													<summary className="flex items-center justify-between cursor-pointer list-none">
														<div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 select-none uppercase tracking-wider">
															<span
																className={`w-2 h-2 rounded-full ${
																	part.state ===
																	"streaming"
																		? "bg-blue-400 dark:bg-blue-500 animate-pulse"
																		: "bg-zinc-300 dark:bg-zinc-600"
																}`}
															/>
															Thinking Process
														</div>
														<div className="text-[10px] text-zinc-400 group-open:rotate-180 transition-transform">
															▼
														</div>
													</summary>
													<pre className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-mono overflow-x-auto leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3">
														{part.text}
													</pre>
												</details>
											);
										default:
											// Handle tool parts or dynamic parts
											if (
												part.type ===
													"tool-invocation" || // Legacy check
												part.type.startsWith("tool-") || // Typed tool
												part.type === "dynamic-tool" || // Dynamic tool
												("toolName" in part &&
													part.toolName) // Generic check
											) {
												return (
													<ToolInvocation
														key={`${message.id}-${i}`}
														part={part}
													/>
												);
											}
											return null;
									}
								})}
							</div>
						))}
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (input.trim()) {
								sendMessage({ text: input });
								setInput("");
							}
						}}
					>
						<input
							className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-4xl p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl left-1/2 -translate-x-1/2"
							value={input}
							placeholder="询问有关原神的一切..."
							onChange={(e) => setInput(e.currentTarget.value)}
						/>
					</form>
				</>
			)}
		</div>
	);
}
