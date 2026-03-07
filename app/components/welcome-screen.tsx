"use client";

interface WelcomeScreenProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (text: string) => void;
}

const SUGGESTED_QUESTIONS = [
  "丝柯克天赋要点普攻还是战技？",
  "德波小蛋糕改良型的材料是什么？",
  `博士周本的语音\u201c此为\u2026\u2026\u201d后面的内容是什么？`,
];

export function WelcomeScreen({
  input,
  onInputChange,
  onSubmit,
}: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center -translate-y-12">
      <h1 className="text-4xl font-bold mb-8 text-zinc-800 dark:text-zinc-200">
        我是原神糕手
      </h1>
      <form
        className="w-full max-w-2xl px-4 mb-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            onSubmit(input);
          }
        }}
      >
        <input
          className="w-full p-4 text-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans text-center"
          value={input}
          placeholder="询问有关原神的一切..."
          onChange={(e) => onInputChange(e.currentTarget.value)}
        />
      </form>
      <div className="flex flex-wrap justify-center gap-3 max-w-2xl px-4">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSubmit(q)}
            className="px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-full transition-colors border border-zinc-200 dark:border-zinc-700"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
