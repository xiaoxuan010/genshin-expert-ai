import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

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

export async function POST(req: Request) {
	const provider = createOpenAICompatible({
		name: "OpenAI Compatible Provider",
		apiKey: process.env.PROVIDER_API_KEY,
		baseURL: process.env.PROVIDER_BASE_URL || "https://api.openai.com/v1",
		includeUsage: true,
	});

	if (!process.env.MCP_BASE_URL) {
		throw new Error("MCP_BASE_URL is not defined in environment variables");
	}

	const genshinWikiMcpClient = await createMCPClient({
		transport: {
			type: "sse",
			url: process.env.MCP_BASE_URL + "/genshin-wiki/sse",

			headers: { Authorization: "Bearer " + process.env.MCP_API_KEY },
		},
	});

	const tools = await genshinWikiMcpClient.tools();

	const { messages }: { messages: UIMessage[] } = await req.json();

	const result = streamText({
		system: SYSTEM_PROMPT,
		model: provider(process.env.PROVIDER_MODEL_NAME || "qwen3"),
		stopWhen: stepCountIs(10),
		tools,
		messages: await convertToModelMessages(messages),
		onFinish: async () => {
			genshinWikiMcpClient.close();
		},
	});

	return result.toUIMessageStreamResponse();
}
