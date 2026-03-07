import { streamText, UIMessage, convertToModelMessages, stepCountIs, tool } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Mwn } from "mwn";
import { z } from "zod";

const WIKI_API_URL =
	process.env.WIKI_API_URL || "https://wiki.biligame.com/ys/api.php";

const SYSTEM_PROMPT = `你是一个搜索助理，需要根据用户的提问，搜索 Wiki 中的相关信息，基于确切的信息回答。你不能基于没有确切来源的信息进行推测或编造答案。当你需要搜索时，使用提供的工具进行搜索，并从搜索结果中提取相关信息来回答用户的问题。

# Wiki 搜索指南

- 角色、武器、圣遗物等游戏专有名词都有其独立的页面，以其中文名作为 title，可直接访问而无需搜索，例如 "温迪"、"秘源机兵·统御械"、"「博士」"等，其中包含了该名词的详细信息；
- 角色还另外分设有攻略和语音页面，分别通过 "温迪/攻略" 和 "温迪语音" 的标题访问，其他角色同理；
- 角色列表可通过 title 为 "角色" 的页面访问，同理适用于 "武器一览"、"圣遗物一览" 等页面；
- 需要查找更多有关原神的信息，还可以访问 "首页" 以获取导航；
- 如果用户提供的是非常细节的信息，例如某段台词、效果描述、世界观文本等，你可以使用搜索工具寻找具体页面，并从中提取相关信息。在搜索时，还可以附加 "insource:" 前缀以深入搜索全文。注意，搜索接口不是问题接口，不要将用户的问题直接输入搜索工具，而是要提炼出关键词进行搜索。

# 工具使用

- 一般使用 get-page 和 search-page 即可，工具已默认设置为原神 Wiki，无需额外指定。
- 在已知名词的情况下，优先使用 get-page 获取确切信息；在需要查找细节或不确定名词的情况下，使用 search-page 进行搜索。
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
			description:
				"从原神 Wiki 获取指定标题的页面内容。适用于已知页面名称的情况，例如角色名、武器名、圣遗物名等。",
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
					return { error: `获取页面 "${title}" 失败：${err instanceof Error ? err.message : String(err)}` };
				}
			},
		}),
		"search-page": tool({
			description:
				"在原神 Wiki 中搜索相关页面。适用于不确定页面名称或需要查找细节信息的情况。可以使用 insource: 前缀搜索全文内容。",
			inputSchema: z.object({
				query: z.string().describe("搜索关键词，可使用 insource: 前缀搜索全文"),
				limit: z
					.number()
					.optional()
					.default(10)
					.describe("返回结果数量，默认为 10"),
			}),
			execute: async ({ query, limit }) => {
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
					return { error: `搜索 "${query}" 失败：${err instanceof Error ? err.message : String(err)}` };
				}
			},
		}),
	};

	const { messages }: { messages: UIMessage[] } = await req.json();

	const result = streamText({
		system: SYSTEM_PROMPT,
		model: provider(process.env.PROVIDER_MODEL_NAME || "qwen3"),
		stopWhen: stepCountIs(10),
		tools,
		messages: await convertToModelMessages(messages),
	});

	return result.toUIMessageStreamResponse();
}
