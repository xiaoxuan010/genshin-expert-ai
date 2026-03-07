"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { ContinuationPrompt } from "./components/continuation-prompt";
import { MessagePart } from "./components/message-part";
import { WelcomeScreen } from "./components/welcome-screen";

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

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
                  {message.role === "user" ? "User: " : "AI: "}
                </div>
                {message.parts?.map((part, i) => (
                  <MessagePart
                    key={`${message.id}-${i}`}
                    part={part}
                    id={`${message.id}-${i}`}
                  />
                ))}
              </div>
            ))}

            {needsContinuation && (
              <ContinuationPrompt
                onContinue={() => handleSend("请继续搜索，补充完善答案。")}
                onFinish={() =>
                  handleSend(
                    "无需继续搜索，请基于已有信息直接整理并给出最终答案。",
                  )
                }
              />
            )}
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
              placeholder={isInitialState ? "询问有关原神的一切..." : "继续追问..."}
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
