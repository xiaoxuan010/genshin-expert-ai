"use client";

import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ChatComposer } from "./components/chat-composer";
import { ContinuationPrompt } from "./components/continuation-prompt";
import { MessagePart } from "./components/message-part";

export default function Chat() {
  const { messages, sendMessage, status, error, regenerate } = useChat({
    experimental_throttle: 50,
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const isFollowing = useRef(true);
  const isProgrammatic = useRef(false);

  const scrollToBottom = useCallback(() => {
    isProgrammatic.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
    setTimeout(() => {
      isProgrammatic.current = false;
    }, 50);
  }, []);

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
        isFollowing.current = false;
      } else if (distanceFromBottom < 80) {
        isFollowing.current = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isFollowing.current) scrollToBottom();
  }, [messages, status, scrollToBottom]);

  const isInitialState = messages.length === 0;

  const needsContinuation = useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    if (status !== "ready") return false;
    if (!lastMessage || lastMessage.role !== "assistant") return false;

    const parts = lastMessage.parts ?? [];
    const hasToolParts = parts.some(
      (p) => "toolName" in p || p.type.startsWith("tool-"),
    );
    const hasTextContent = parts.some(
      (p) => p.type === "text" && p.text.trim().length > 0,
    );

    return hasToolParts && !hasTextContent;
  }, [messages, status]);

  const handleSend = useCallback(
    (text: string, files?: FileList) => {
      isFollowing.current = true;
      sendMessage({ text, files });
    },
    [sendMessage],
  );

  const handleContinue = useCallback(() => {
    handleSend("请继续搜索，补充完善答案。");
  }, [handleSend]);

  const handleFinish = useCallback(() => {
    handleSend("无需继续搜索，请基于已有信息直接整理并给出最终答案。");
  }, [handleSend]);

  return (
    <div className="flex flex-col min-h-screen w-full max-w-4xl mx-auto px-4 stretch">
      {!isInitialState && (
        <div className="py-24">
          {messages.map((message) => (
            <div key={message.id} className="mb-4">
              <div className="font-bold mb-2">
                {message.role === "user" ? "User: " : "AI: "}
              </div>
              {message.parts?.map((part, i) => {
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
              onContinue={handleContinue}
              onFinish={handleFinish}
            />
          )}

          {error && (
            <div className="mt-2 mb-4 p-4 rounded-2xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  请求发生错误
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/60 mt-0.5 line-clamp-3">
                  {error.message || "请求失败，请稍后重试"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => regenerate()}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      <ChatComposer
        isInitialState={isInitialState}
        disabled={status !== "ready"}
        onSend={handleSend}
      />
    </div>
  );
}
