# 原神糕手 Genshin Expert AI

一个基于 Vercel AI SDK 构建的智能化原神百科搜索助理。它能够通过调用原神 Wiki API 获取实时、准确的游戏数据（角色、武器、圣遗物、攻略等），并结合大语言模型的能力为用户提供深度的问答支持。

## ✨ 功能特性

- **实时 Wiki 搜索**：集成原神 Wiki (BiliBili Wiki) API，支持精确页面获取 (`get-page`) 和全文关键词搜索 (`search-page`)。
- **智能化搜索策略**：自动识别用户意图，优先尝试获取确切页面，必要时进行全文检索。
- **流式响应与推理展示**：支持 AI 推理过程的实时展示，让答案的来源透明可追溯。
- **长文本处理**：自动处理 Wiki 的长文本内容，支持多步思考与链式搜索。
- **现代化 UI**：基于 Next.js 和 Tailwind CSS 构建，提供流畅的聊天交互体验。

## 🚀 快速开始

1. **安装依赖**：

    ```bash
    pnpm install
    ```

2. **配置环境变量**：
   在项目根目录创建 `.env.local` 文件并填写：

    ```env
    # 必填，替换为你的 API Key
    PROVIDER_API_KEY=your_api_key_here

    # 可选
    PROVIDER_BASE_URL=https://api.openai.com/v1
    PROVIDER_MODEL_NAME=gpt-5.4
    WIKI_API_URL=https://wiki.biligame.com/ys/api.php
    ```

3. **运行开发服务器**：
    ```bash
    pnpm dev
    ```

## 🏗️ 技术架构

项目采用现代 Web 开发栈，结合 AI SDK 实现工具调用循环：

- **前端框架**：[Next.js 15 (App Router)](https://nextjs.org/)
- **AI 集成**：[Vercel AI SDK](https://sdk.vercel.ai/)
- **模型接口**：OpenAI Compatible API（可配置任何兼容 OpenAI 格式的服务商）
- **数据来源**：[Mwn (MediaWiki Node.js client)](https://github.com/marvin-j-w/mwn) 连接 BiliBili 原神 Wiki
- **样式方案**：Tailwind CSS
- **核心逻辑**：
    - `app/api/chat/route.ts`: 后端路由，定义了 `get-page` 和 `search-page` 工具，处理 LLM 的流式输出。
    - `app/page.tsx`: 聊天主界面，处理消息状态、自动滚动和交互逻辑。
    - `components/`: 封装了工具调用结果展示、推理过程卡片、消息渲染等高阶组件。

## 🛠️ 工具说明

- **`get-page`**：当你需要查询特定的角色（如“温迪”）、武器（如“护摩之杖”）或特定页面（如“温迪/攻略”）时，直接获取渲染后的 Wiki 源码。
- **`search-page`**：当你只有模糊关键词或需要搜索具体描述时，在 Wiki 全文库中检索相关页面。

## 致谢/来源

- 感谢 [原神旅行者酒馆 Wiki](https://wiki.biligame.com/ys/%E9%A6%96%E9%A1%B5) 和各社区贡献者维护的丰富数据资料。
