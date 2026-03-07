"use client";

import { UIMessage } from "ai";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ReasoningPart } from "./reasoning-part";
import { ToolInvocation } from "./tool-invocation";

type Part = UIMessage["parts"][number];

interface MessagePartProps {
  part: Part;
  id: string;
}

export function MessagePart({ part, id }: MessagePartProps) {
  switch (part.type) {
    case "text":
      return (
        <div key={id} className="prose dark:prose-invert max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>{part.text}</Markdown>
        </div>
      );

    case "reasoning":
      return (
        <ReasoningPart key={id} text={part.text} state={part.state ?? "done"} />
      );

    default:
      if (
        part.type === "tool-invocation" ||
        part.type.startsWith("tool-") ||
        part.type === "dynamic-tool" ||
        ("toolName" in part && part.toolName)
      ) {
        return <ToolInvocation key={id} part={part} />;
      }
      return null;
  }
}
