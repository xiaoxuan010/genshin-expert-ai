import { streamText, UIMessage, convertToModelMessages, stepCountIs, tool } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Mwn } from "mwn";
import { z } from "zod";

let lastSearchTime = 0;
let searchQueue: Promise<unknown> = Promise.resolve();
let pendingSearchCount = 0;
const MAX_PENDING_SEARCHES = 3; // 限制同时等待搜索的数量

const WIKI_API_URL =
	process.env.WIKI_API_URL || "https://wiki.biligame.com/ys/api.php";

const SYSTEM_PROMPT = `# 身份

你是一个名叫“原神糕手（Genshin Expert）”的搜索助理，需要根据用户的提问，搜索相关信息解决问题。

# Wiki 搜索指南

- 角色、武器、圣遗物等游戏专有名词都有其独立的页面，以其中文名作为 title，可直接访问而无需搜索，例如 "温迪"、"秘源机兵·统御械"、"「博士」"等，其中包含了该名词的详细信息；
- 角色还另外分设有攻略和语音页面，分别通过 "温迪/攻略" 和 "温迪语音" 的标题访问，其他角色同理；
- 所有角色、武器、圣遗物等列表可通过总览页面访问，例如 "角色"、"武器一览"、"圣遗物一览" 等；
- 需要查找更多有关原神的信息但不确定具体页面名称的，可以访问 "首页" 以获取导航；
- 如遇显然非游戏内官方名词，建议先访问 "黑话" 页面了解相关信息；
- 在已知名词的情况下，优先使用 get-page 获取确切信息；需要查找细节或不确定名词时，使用搜索工具寻找具体页面；注意：搜索接口能力有限，请提炼并输入不超过 2 个关键名词；不需要将 "原神" 作为搜索关键词。

# 回答指引

- 必须基于参考信息回答问题，不能基于未知来源的信息进行推测。
- 在回答最后，请另起一个“信息来源”段落，列出你参考的 Wiki 页面标题，并附上链接。例如：- [原神 Wiki：温迪](https://wiki.biligame.com/ys/温迪)。
- 如果参考的页面太多，可以附上最相关的几个链接。
`;

function createWikiBot() {
	return new Mwn({
		apiUrl: WIKI_API_URL,
		userAgent: "genshin-expert-ai/1.0",
	});
}

export async function POST(req: Request) {
	const provider = createOpenAICompatible({
		name: "OpenAI Compatible Provider",
		apiKey: process.env.PROVIDER_API_KEY,
		baseURL: process.env.PROVIDER_BASE_URL || "https://api.openai.com/v1",
		includeUsage: true,
	});

	const bot = createWikiBot();

	const tools = {
		"get-page": tool({
			description: "从原神 Wiki 获取指定标题的页面内容。",
			inputSchema: z.object({
				title: z.string().describe("要获取的 Wiki 页面标题"),
			}),
			execute: async ({ title }) => {
				try {
					const page = await bot.read(title);
					if (page.missing) {
						return { error: `页面 "${title}" 不存在` };
					}
					const content =
						page.revisions && page.revisions[0]
							? page.revisions[0].content
							: "";
					return { title: page.title, content };
				} catch (err) {
					return {
						error: `获取页面 "${title}" 失败：${err instanceof Error ? err.message : String(err)}`,
					};
				}
			},
		}),
		"search-page": tool({
			description:
				"在原神 Wiki 中搜索相关页面，适用于不确定页面名称或需要查找细节信息的情况。",
			inputSchema: z.object({
				query: z.string().describe("搜索关键词"),
				limit: z
					.number()
					.optional()
					.default(10)
					.describe("返回结果数量，默认为 10"),
			}),
			execute: async ({ query, limit }) => {
				if (pendingSearchCount >= MAX_PENDING_SEARCHES) {
					return {
						error: `目前搜索请求过多，为了遵守 Wiki 访问限制，请稍后再试，或者尝试直接使用 get-page 工具查询已知页面的确切名称。`,
					};
				}

				pendingSearchCount++;
				try {
					// 使用 Promise 队列确保串行执行并严格遵守 3s 间隔
					const searchResult = await (searchQueue = searchQueue.then(
						async () => {
							const now = Date.now();
							const waitTime = 3000 - (now - lastSearchTime);
							if (waitTime > 0) {
								await new Promise((resolve) =>
									setTimeout(resolve, waitTime),
								);
							}
							lastSearchTime = Date.now();

							try {
								const results = await bot.search(query, limit, [
									"snippet",
									"titlesnippet",
								]);
								return results.map((r) => ({
									title: r.title,
									snippet: r.snippet,
								}));
							} catch (err) {
								return {
									error: `搜索 "${query}" 失败：${err instanceof Error ? err.message : String(err)}`,
								};
							}
						},
					));

					return searchResult;
				} finally {
					pendingSearchCount--;
				}
			},
		}),
	};

	const { messages }: { messages: UIMessage[] } = await req.json();

	const result = streamText({
		system: SYSTEM_PROMPT,
		model: provider(process.env.PROVIDER_MODEL_NAME || "gpt-5.4"),
		stopWhen: stepCountIs(10),
		tools,
		messages: await convertToModelMessages(messages),
	});

	// 对 SSE 流进行转换，为每个 step 的 toolCallId 添加 step 前缀
	// 以解决模型在不同 step 中复用相同 toolCallId（如 call_0）导致 AI SDK 客户端
	// 将多个 tool call 合并为同一个 part 的问题
	const baseResponse = result.toUIMessageStreamResponse();
	const originalBody = baseResponse.body;

	if (!originalBody) {
		return baseResponse;
	}

	let stepCount = 0;
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();

	const transformedBody = originalBody.pipeThrough(
		new TransformStream<Uint8Array, Uint8Array>({
			transform(chunk, controller) {
				const text = decoder.decode(chunk, { stream: true });
				const lines = text.split("\n");
				const outputLines: string[] = [];

				for (const line of lines) {
					if (!line.startsWith("data: ")) {
						outputLines.push(line);
						continue;
					}

					const jsonStr = line.slice(6);
					if (jsonStr === "[DONE]") {
						outputLines.push(line);
						continue;
					}

					let event: Record<string, unknown>;
					try {
						event = JSON.parse(jsonStr);
					} catch {
						outputLines.push(line);
						continue;
					}

					if (event.type === "start-step") {
						stepCount++;
					}

					// 对含有 toolCallId 的事件添加 step 前缀
					if (
						typeof event.toolCallId === "string" &&
						stepCount > 0
					) {
						event = {
							...event,
							toolCallId: `s${stepCount}_${event.toolCallId}`,
						};
					}

					outputLines.push(`data: ${JSON.stringify(event)}`);
				}

				controller.enqueue(encoder.encode(outputLines.join("\n")));
			},
		}),
	);

	return new Response(transformedBody, {
		status: baseResponse.status,
		headers: baseResponse.headers,
	});
}
