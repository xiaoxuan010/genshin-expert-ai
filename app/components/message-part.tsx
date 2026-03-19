"use client";

import { UIMessage } from "ai";
import { MemoizedMarkdown } from "./memoized-markdown";
import { ReasoningPart } from "./reasoning-part";
import { ToolInvocation } from "./tool-invocation";

type Part = UIMessage["parts"][number];

interface MessagePartProps {
  part: Part;
  id: string;
  isFollowedByNewStep?: boolean;
}

export function MessagePart({
  part,
  id,
  isFollowedByNewStep,
}: MessagePartProps) {
  switch (part.type) {
    case "text":
      return (
        <div key={id} className="prose dark:prose-invert max-w-none my-3">
          <MemoizedMarkdown id={id} content={part.text} />
        </div>
      );

    case "file":
      if (part.mediaType?.startsWith("image/")) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={id}
            src={part.url}
            alt={part.filename ?? "图片"}
            className="max-w-xs max-h-64 rounded-lg border border-zinc-200 dark:border-zinc-700 my-1 object-contain"
          />
        );
      }
      return null;

    case "reasoning":
      return (
        <ReasoningPart
          key={id}
          text={part.text}
          state={part.state ?? "done"}
          isFollowedByNewStep={isFollowedByNewStep}
        />
      );

    default:
      if (
        part.type === "tool-invocation" ||
        part.type.startsWith("tool-") ||
        part.type === "dynamic-tool" ||
        ("toolName" in part && part.toolName) ||
        "toolInvocation" in part
      ) {
        return (
          <ToolInvocation
            key={id}
            part={part}
            isFollowedByNewStep={isFollowedByNewStep}
          />
        );
      }
      return null;
  }
}
