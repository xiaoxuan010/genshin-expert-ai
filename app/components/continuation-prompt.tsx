"use client";

interface ContinuationPromptProps {
  onContinue: () => void;
  onFinish: () => void;
}

export function ContinuationPrompt({
  onContinue,
  onFinish,
}: ContinuationPromptProps) {
  return (
    <div className="mt-2 mb-4 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Genshin Expert 已进行了一些研究，是否继续深入？
        </p>
        <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-0.5">
          继续将发起新一轮搜索
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onContinue}
          className="px-4 py-1.5 text-sm font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
        >
          继续
        </button>
        <button
          onClick={onFinish}
          className="px-4 py-1.5 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          结束搜索
        </button>
      </div>
    </div>
  );
}
