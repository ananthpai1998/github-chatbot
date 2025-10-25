# Complete Chat Flow Diagram - All Models & Components

## Model Architecture Overview

The application uses **4 different model types** for different purposes:

1. **Chat Model** - Main conversation model (user-selected: Claude, Gemini, GPT)
2. **Title Model** - NOT USED (Simple string extraction, no LLM call)
3. **Artifact Model** - For generating code/text/sheet documents (Test env only)
4. **Reasoning Model** - NOT IMPLEMENTED (Reserved for future use)

### Current Reality:
- ✅ **Chat Model**: Used for main conversation (user's API key)
- ❌ **Title Model**: Simple string extraction from first message (no LLM)
- ⚠️ **Artifact Model**: Only works in TEST environment (myProvider)
- ❌ **Reasoning Model**: Not implemented (placeholder in test mocks)

## Complete End-to-End Flow Chart

```mermaid
flowchart TB
    subgraph Browser["🌐 BROWSER (Client-Side)"]
        User([👤 User])

        subgraph UIComponents["Frontend Components"]
            ChatPage["📄 chat/[id]/page.tsx<br/>(Server Component)"]
            ChatComp["💬 components/chat.tsx<br/>(Client Component)"]
            MultiInput["⌨️ multimodal-input.tsx<br/>(Input Field)"]
            Messages["📜 messages.tsx<br/>(Message Display)"]
            TokenDisplay["📊 token-usage-display.tsx<br/>(Token Counter)"]
            ModelSelector["🎛️ model-selector.tsx<br/>(Model Dropdown)"]
        end

        subgraph Hooks["React Hooks"]
            UseChat["🔄 useChat<br/>(AI SDK Hook)"]
            UseAPIKeys["🔑 use-api-keys.ts<br/>(API Key Management)"]
            UseDataStream["📡 data-stream-provider.tsx<br/>(SSE Stream Context)"]
        end

        LocalStorage["💾 localStorage<br/>(devmate_api_keys)"]
    end

    subgraph Server["🖥️ SERVER (Next.js API Routes)"]
        subgraph APIRoutes["API Routes"]
            ChatAPI["🔌 api/chat/route.ts<br/>(Main Chat Endpoint)"]
            Actions["⚙️ app/(chat)/actions.ts<br/>(Server Actions)"]
        end

        subgraph AuthLayer["Authentication"]
            SupabaseAuth["🔐 Supabase Auth<br/>(auth.users table)"]
            SupabaseClient["📦 lib/supabase/server.ts<br/>(Client Factory)"]
        end

        subgraph AILayer["AI Processing"]
            Providers["🤖 lib/ai/providers.ts<br/>(Provider Factory)"]
            Models["📋 lib/ai/models.ts<br/>(Model Config)"]
            Prompts["📝 lib/ai/prompts.ts<br/>(System Prompts)"]
        end

        subgraph ToolsLayer["AI Tools"]
            GetWeather["🌤️ tools/get-weather.ts"]
            CreateDoc["📄 tools/create-document.ts"]
            UpdateDoc["✏️ tools/update-document.ts"]
            GitHubTools["🐙 tools/github-tools.ts<br/>(MCP Integration)"]
        end

        subgraph ArtifactLayer["Artifact Generation"]
            ArtifactServer["🎨 lib/artifacts/server.ts"]
            CodeHandler["💻 artifacts/code/server.ts"]
            TextHandler["📝 artifacts/text/server.ts"]
            SheetHandler["📊 artifacts/sheet/server.ts"]
        end

        subgraph DBLayer["Database Layer"]
            Queries["🗄️ lib/db/queries.ts<br/>(DB Functions)"]
            Schema["📐 lib/db/schema.ts<br/>(Tables)"]
        end
    end

    subgraph Database["🗄️ POSTGRESQL DATABASE"]
        AuthUsers["👥 auth.users<br/>(Supabase Auth)"]
        ChatTable["💬 Chat<br/>(id, userId, title, visibility, lastContext)"]
        MessageTable["💌 Message_v2<br/>(id, chatId, role, parts, attachments)"]
        StreamTable["📺 stream<br/>(id, chatId)"]
        DocumentTable["📄 Document<br/>(id, userId, title, kind, content)"]
    end

    subgraph External["🌍 EXTERNAL APIS"]
        LLMAPIs["🧠 LLM APIs"]

        subgraph LLMProviders["LLM Providers"]
            GoogleAPI["🔵 Google Gemini API"]
            AnthropicAPI["🟣 Anthropic Claude API"]
            OpenAIAPI["🟢 OpenAI GPT API"]
        end

        TokenLensAPI["💰 TokenLens API<br/>(Pricing Catalog)"]
        GitHubMCP["🐙 GitHub MCP Server<br/>(GitHub Integration)"]
        VercelGeo["📍 Vercel Functions<br/>(Geolocation)"]
    end

    subgraph Models["🎯 MODEL TYPES"]
        ChatModel["💬 CHAT MODEL<br/>(User Selected)<br/>Primary conversation model"]
        TitleModel["📌 TITLE MODEL<br/>(NOT USED - String Extraction)<br/>Simple text processing"]
        ArtifactModel["🎨 ARTIFACT MODEL<br/>(Test Env Only)<br/>Code/Text/Sheet generation"]
        ReasoningModel["🧠 REASONING MODEL<br/>(NOT IMPLEMENTED)<br/>Reserved for future"]
    end

    %% User Interaction Flow
    User -->|1. Opens chat page| ChatPage
    ChatPage -->|2. Renders| ChatComp
    ChatComp -->|3. Initialize| UseChat
    ChatComp -->|4. Load API Keys| UseAPIKeys
    UseAPIKeys -->|5. Read keys| LocalStorage
    LocalStorage -->|6. Return {provider: key_base64}| UseAPIKeys
    UseAPIKeys -->|7. Decode base64| UseAPIKeys
    UseAPIKeys -->|8. Return {hasAPIKey(), getAPIKey()}| ChatComp

    ChatComp -->|9. Check hasAPIKey(provider)| ChatComp
    ChatComp -->|10. Enable/Disable input| MultiInput

    User -->|11. Types message| MultiInput
    User -->|12. Selects model| ModelSelector
    ModelSelector -->|13. Update currentModelId| ChatComp

    User -->|14. Press Enter| MultiInput
    MultiInput -->|15. Call sendMessage()| UseChat
    UseChat -->|16. Generate UUID| UseChat

    %% API Key Retrieval (Using Ref Pattern)
    UseChat -->|17. prepareSendMessagesRequest()| UseChat
    UseChat -->|18. getAPIKeyRef.current(provider)| UseAPIKeys
    UseAPIKeys -->|19. Return decrypted API key| UseChat

    %% Build Request
    UseChat -->|20. Build request body| UseChat
    UseChat -->|21. POST /api/chat| ChatAPI

    %% Server-Side Processing
    ChatAPI -->|22. Validate schema| ChatAPI
    ChatAPI -->|23. Get model config| Models
    Models -->|24. Return ChatModel config| ChatAPI

    ChatAPI -->|25. getUser()| SupabaseClient
    SupabaseClient -->|26. Query user| SupabaseAuth
    SupabaseAuth -->|27. Query| AuthUsers
    AuthUsers -->|28. Return user| SupabaseAuth
    SupabaseAuth -->|29. Return {id, email}| ChatAPI

    %% Rate Limiting
    ChatAPI -->|30. getMessageCountByUserId()| Queries
    Queries -->|31. COUNT messages (24h)| MessageTable
    MessageTable -->|32. Return count| Queries
    Queries -->|33. Return count| ChatAPI
    ChatAPI -->|34. Check rate limit| ChatAPI

    %% Chat Existence Check
    ChatAPI -->|35. getChatById()| Queries
    Queries -->|36. SELECT chat| ChatTable
    ChatTable -->|37. Return chat or null| Queries
    Queries -->|38. Return result| ChatAPI

    %% Title Generation (NO LLM - Simple String Extraction)
    ChatAPI -->|39. IF new chat| ChatAPI
    ChatAPI -->|40. generateTitleFromUserMessage()| Actions
    Actions -->|41. Extract first 10 words| Actions
    Actions -->|42. Substring(0, 50)| Actions
    Actions -->|43. Return title string| ChatAPI
    TitleModel -.->|NOT USED| Actions

    %% Save Chat
    ChatAPI -->|44. saveChat()| Queries
    Queries -->|45. INSERT chat| ChatTable
    ChatTable -->|46. Confirm save| Queries
    Queries -->|47. Return success| ChatAPI

    %% Load Full Chat History
    ChatAPI -->|48. getMessagesByChatId()| Queries
    Queries -->|49. SELECT * FROM Message_v2<br/>WHERE chatId=?<br/>ORDER BY createdAt| MessageTable
    MessageTable -->|50. Return ALL messages<br/>(no limit!)| Queries
    Queries -->|51. Return messagesFromDb[]| ChatAPI

    %% Convert Messages
    ChatAPI -->|52. convertToUIMessages()| ChatAPI
    ChatAPI -->|53. Append new message| ChatAPI
    ChatAPI -->|54. uiMessages = [history + new]| ChatAPI

    %% Save User Message
    ChatAPI -->|55. saveMessages([userMsg])| Queries
    Queries -->|56. INSERT message| MessageTable
    MessageTable -->|57. Confirm save| Queries

    %% Create Stream ID
    ChatAPI -->|58. createStreamId()| Queries
    Queries -->|59. INSERT stream| StreamTable

    %% Initialize Chat Model
    ChatAPI -->|60. getLanguageModel(provider, modelId, apiKey)| Providers
    Providers -->|61. createProviderInstance()| Providers

    Providers -->|62. IF google| GoogleAPI
    Providers -->|63. IF anthropic| AnthropicAPI
    Providers -->|64. IF openai| OpenAIAPI

    GoogleAPI -->|65. Return provider instance| Providers
    AnthropicAPI -->|65. Return provider instance| Providers
    OpenAIAPI -->|65. Return provider instance| Providers

    Providers -->|66. providerInstance(modelId)| Providers
    Providers -->|67. Return LanguageModelV2| ChatAPI
    ChatModel -->|Represents| Providers

    %% Initialize Tools
    ChatAPI -->|68. Initialize base tools| ChatAPI
    ChatAPI -->|69. Create getWeather tool| GetWeather
    ChatAPI -->|70. Create createDocument tool| CreateDoc
    ChatAPI -->|71. Create updateDocument tool| UpdateDoc

    ChatAPI -->|72. IF githubToken| ChatAPI
    ChatAPI -->|73. createGitHubTools()| GitHubTools
    GitHubTools -->|74. Connect to MCP| GitHubMCP
    GitHubMCP -->|75. Return MCP tools| GitHubTools
    GitHubTools -->|76. Return GitHub tools| ChatAPI

    ChatAPI -->|77. Merge all tools| ChatAPI

    %% Build System Prompt
    ChatAPI -->|78. systemPrompt()| Prompts
    ChatAPI -->|79. Get geolocation| VercelGeo
    VercelGeo -->|80. Return {lat, lon, city, country}| ChatAPI
    Prompts -->|81. Build: regularPrompt +<br/>requestHints +<br/>artifactsPrompt| Prompts
    Prompts -->|82. Return system prompt| ChatAPI

    %% Stream Text from LLM
    ChatAPI -->|83. streamText(model, messages, tools)| LLMAPIs
    ChatAPI -->|84. convertToModelMessages(uiMessages)| ChatAPI

    %% LLM Selection Based on Provider
    ChatAPI -->|85. Route to provider| LLMAPIs
    LLMAPIs -->|86. Send request| GoogleAPI
    LLMAPIs -->|86. Send request| AnthropicAPI
    LLMAPIs -->|86. Send request| OpenAIAPI

    %% LLM Processing
    GoogleAPI -->|87. Process with full history| GoogleAPI
    AnthropicAPI -->|87. Process with full history| AnthropicAPI
    OpenAIAPI -->|87. Process with full history| OpenAIAPI

    %% Streaming Response
    GoogleAPI -->|88. Stream chunks| ChatAPI
    AnthropicAPI -->|88. Stream chunks| ChatAPI
    OpenAIAPI -->|88. Stream chunks| ChatAPI

    ChatAPI -->|89. toUIMessageStream()| ChatAPI
    ChatAPI -->|90. Write to dataStream| UseDataStream
    UseDataStream -->|91. SSE events| UseChat
    UseChat -->|92. Update messages state| ChatComp
    ChatComp -->|93. Render streaming text| Messages
    Messages -->|94. Display to user| User

    %% Tool Calling (If Triggered)
    ChatAPI -.->|95. IF tool call| GetWeather
    ChatAPI -.->|96. IF createDocument| CreateDoc

    CreateDoc -.->|97. Call documentHandler| ArtifactServer
    ArtifactServer -.->|98. Route by kind| CodeHandler
    ArtifactServer -.->|98. Route by kind| TextHandler
    ArtifactServer -.->|98. Route by kind| SheetHandler

    CodeHandler -.->|99. streamObject()| ArtifactModel
    ArtifactModel -.->|100. ONLY IN TEST ENV<br/>myProvider.languageModel('artifact-model')| CodeHandler
    CodeHandler -.->|101. Stream code delta| UseDataStream

    CodeHandler -.->|102. saveDocument()| Queries
    Queries -.->|103. INSERT document| DocumentTable

    %% Stream Completion
    ChatAPI -->|104. Stream complete| ChatAPI
    ChatAPI -->|105. Extract usage stats| ChatAPI

    %% Token Cost Calculation
    ChatAPI -->|106. fetchModels()| TokenLensAPI
    TokenLensAPI -->|107. Return pricing catalog| ChatAPI
    ChatAPI -->|108. getUsage()| ChatAPI
    ChatAPI -->|109. Calculate cost| ChatAPI
    ChatAPI -->|110. Merge usage stats| ChatAPI

    %% Stream Usage Data
    ChatAPI -->|111. dataStream.write(data-usage)| UseDataStream
    UseDataStream -->|112. SSE event| UseChat
    UseChat -->|113. onData({type: 'data-usage'})| ChatComp
    ChatComp -->|114. setUsage()| ChatComp
    ChatComp -->|115. Update token display| TokenDisplay
    TokenDisplay -->|116. Show tokens + cost| User

    %% Save Assistant Response
    ChatAPI -->|117. onFinish({messages})| ChatAPI
    ChatAPI -->|118. saveMessages([assistantMsg])| Queries
    Queries -->|119. INSERT message| MessageTable

    %% Update Chat Context
    ChatAPI -->|120. updateChatLastContextById()| Queries
    Queries -->|121. UPDATE chat.lastContext| ChatTable

    %% Close Stream
    ChatAPI -->|122. Close SSE stream| UseChat
    UseChat -->|123. onFinish()| UseChat
    UseChat -->|124. mutate(chatHistoryKey)| ChatComp
    ChatComp -->|125. Re-fetch sidebar| ChatPage

    ChatComp -->|126. Enable input| MultiInput
    MultiInput -->|127. Ready for next message| User

    %% Styling
    classDef userNode fill:#e1f5ff,stroke:#01579b,stroke-width:3px
    classDef frontendNode fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef backendNode fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef dbNode fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef externalNode fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef modelNode fill:#fff9c4,stroke:#f57f17,stroke-width:3px

    class User userNode
    class ChatPage,ChatComp,MultiInput,Messages,TokenDisplay,ModelSelector,UseChat,UseAPIKeys,UseDataStream,LocalStorage frontendNode
    class ChatAPI,Actions,SupabaseAuth,SupabaseClient,Providers,Models,Prompts,GetWeather,CreateDoc,UpdateDoc,GitHubTools,ArtifactServer,CodeHandler,TextHandler,SheetHandler,Queries,Schema backendNode
    class AuthUsers,ChatTable,MessageTable,StreamTable,DocumentTable dbNode
    class GoogleAPI,AnthropicAPI,OpenAIAPI,TokenLensAPI,GitHubMCP,VercelGeo,LLMAPIs externalNode
    class ChatModel,TitleModel,ArtifactModel,ReasoningModel modelNode
```

## Model Type Details

### 1. Chat Model (Primary Conversation) 💬

**Purpose**: Main conversational AI model
**Used For**: User chat interactions, tool calling, general Q&A
**Selection**: User-selected from model dropdown
**API Key**: User-provided (from localStorage)
**Location**: Used in `app/(chat)/api/chat/route.ts:306-350`

**Available Models**:
```typescript
// Anthropic
- claude-3-5-sonnet-20241022 (200K context)
- claude-3-5-haiku-20241022 (200K context)
- claude-3-opus-20240229 (200K context)

// Google
- gemini-2.0-flash-exp (1M context)
- gemini-exp-1206 (200K context)
- gemini-1.5-pro (2M context)
- gemini-1.5-flash (1M context)

// OpenAI
- gpt-4o (128K context)
- gpt-4o-mini (128K context)
- gpt-4-turbo (128K context)
- o1-preview (128K, no tools/vision)
- o1-mini (128K, no tools/vision)
```

**Code**:
```typescript
// app/(chat)/api/chat/route.ts:251-257
const model = getLanguageModel(
  modelConfig.provider,
  modelConfig.modelId,
  apiKey  // User's API key
);

const result = streamText({
  model,  // Chat model
  system: systemPrompt({ selectedChatModel, requestHints }),
  messages: convertToModelMessages(uiMessages),
  tools: allTools,
});
```

### 2. Title Model (NOT USED) 📌

**Purpose**: ~~Generate chat title from first message~~ REPLACED WITH STRING EXTRACTION
**Reality**: Simple JavaScript string manipulation, NO LLM call
**Location**: `app/(chat)/actions.ts:18-45`

**Original Intent**: Use LLM to generate creative title
**Actual Implementation**: Extract first 10 words, truncate to 50 chars

**Code**:
```typescript
// app/(chat)/actions.ts:18-45
export async function generateTitleFromUserMessage({ message }) {
  // Extract text from message parts
  let messageText = "";
  if ("parts" in message && Array.isArray(message.parts)) {
    const textPart = message.parts.find((part: any) => part.type === "text");
    if (textPart && "text" in textPart) {
      messageText = textPart.text;
    }
  }

  if (!messageText) return "New Chat";

  // Simple string extraction - NO LLM CALL
  const words = messageText.split(" ").slice(0, 10).join(" ");
  const title = words.length > 50 ? words.substring(0, 50) + "..." : words;

  return title || "New Chat";
}
```

**Why Not Used**:
- Would require additional LLM API call (cost)
- Simple extraction is fast and free
- Good enough for most cases

### 3. Artifact Model (Code/Text/Sheet Generation) 🎨

**Purpose**: Generate document content (code, text, spreadsheets)
**Used For**: When LLM calls `createDocument` or `updateDocument` tools
**Selection**: Hardcoded as "artifact-model"
**API Key**: NOT APPLICABLE (only works in test env)
**Location**: `artifacts/code/server.ts:17`, `artifacts/text/server.ts`, `artifacts/sheet/server.ts`

**CRITICAL LIMITATION**: ⚠️ **ONLY WORKS IN TEST ENVIRONMENT**

**Why**:
```typescript
// lib/ai/providers.ts:74-91
export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        "claude-3-5-sonnet": chatModel,
        "claude-3-5-haiku": reasoningModel,
        "gemini-2-0-flash": titleModel,
        "gpt-4o": artifactModel,  // ← Artifact model
      },
    })
  : null;  // ← In production, myProvider is NULL!
```

**Production Behavior**:
```typescript
// artifacts/code/server.ts:9-12
if (!myProvider) {
  throw new Error(
    "Artifact generation is not available in production mode without a configured provider"
  );
}
```

**In Production**: Artifacts will throw error unless you configure a provider!

**Test Environment Usage**:
```typescript
// artifacts/code/server.ts:16-23
const { fullStream } = streamObject({
  model: myProvider.languageModel("artifact-model"),
  system: codePrompt,
  prompt: title,
  schema: z.object({ code: z.string() }),
});
```

### 4. Reasoning Model (NOT IMPLEMENTED) 🧠

**Purpose**: Reserved for advanced reasoning tasks
**Status**: Placeholder in test mocks, not used anywhere
**Location**: Only in `lib/ai/providers.ts:79` (test env)

**Code**:
```typescript
// lib/ai/providers.ts:74-91
export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        "claude-3-5-sonnet": chatModel,
        "claude-3-5-haiku": reasoningModel,  // ← Defined but never used
        "gemini-2-0-flash": titleModel,
        "gpt-4o": artifactModel,
      },
    })
  : null;
```

**Future Use Cases** (potential):
- Complex multi-step reasoning
- Math problem solving
- Code analysis
- Strategic planning

## File Inventory

### Frontend Files (Browser)
1. `app/(chat)/chat/[id]/page.tsx` - Chat page (Server Component)
2. `components/chat.tsx` - Main chat component (398 lines)
3. `components/multimodal-input.tsx` - Input field with attachments
4. `components/messages.tsx` - Message list display
5. `components/message.tsx` - Individual message component
6. `components/chat/token-usage-display.tsx` - Token counter
7. `components/model-selector.tsx` - Model dropdown
8. `hooks/use-api-keys.ts` - API key management (localStorage)
9. `hooks/use-chat-visibility.ts` - Chat visibility state
10. `components/data-stream-provider.tsx` - SSE stream context

### Backend Files (Server)
11. `app/(chat)/api/chat/route.ts` - Main chat API (400 lines)
12. `app/(chat)/actions.ts` - Server actions (title generation)
13. `lib/supabase/server.ts` - Supabase client factory
14. `lib/db/queries.ts` - Database query functions (562 lines)
15. `lib/db/schema.ts` - Database schema definitions
16. `lib/ai/providers.ts` - AI provider factory (92 lines)
17. `lib/ai/models.ts` - Model configurations (166 lines)
18. `lib/ai/prompts.ts` - System prompts (115 lines)
19. `lib/ai/tools/get-weather.ts` - Weather tool
20. `lib/ai/tools/create-document.ts` - Document creation tool
21. `lib/ai/tools/update-document.ts` - Document update tool
22. `lib/ai/tools/request-suggestions.ts` - Suggestions tool
23. `lib/ai/tools/github-tools.ts` - GitHub MCP integration
24. `lib/artifacts/server.ts` - Artifact handler factory
25. `artifacts/code/server.ts` - Code artifact handler
26. `artifacts/text/server.ts` - Text artifact handler
27. `artifacts/sheet/server.ts` - Sheet artifact handler
28. `lib/utils.ts` - Utility functions (UUID, conversions)
29. `lib/errors.ts` - Error handling classes

### Database Tables
30. `auth.users` (Supabase) - User authentication
31. `Chat` - Chat metadata
32. `Message_v2` - Chat messages
33. `stream` - Stream tracking
34. `Document` - Generated documents (artifacts)
35. `Suggestion` - Document suggestions
36. `Vote` - Message votes

### External Services
37. Google Gemini API
38. Anthropic Claude API
39. OpenAI GPT API
40. TokenLens API (pricing)
41. GitHub MCP Server (optional)
42. Vercel Functions (geolocation)

## Key Architectural Decisions

### 1. Why No Title Model?
- **Original Plan**: Use LLM to generate creative titles
- **Reality**: Too expensive for every chat creation
- **Solution**: Simple string extraction (first 10 words)
- **Trade-off**: Less creative titles, but free and instant

### 2. Why Artifact Model Only in Test?
- **Problem**: Artifact generation requires additional LLM calls
- **Challenge**: Can't use user's API key for internal tool operations
- **Current Solution**: Only works in test environment with mocked models
- **Production Issue**: Artifacts throw error without configured provider
- **Future Solution**: Needs server-side API key management or user consent

### 3. Why Full History, No Truncation?
- **Decision**: Load ALL messages from database every time
- **Reason**: Simpler implementation, ensures full context
- **Problem**: Doesn't scale, will hit token limits eventually
- **Future**: Needs sliding window or summarization

### 4. Why User-Provided API Keys?
- **Decision**: Store API keys in browser localStorage
- **Reason**: Self-hosted app, no server-side key management
- **Benefit**: Users bring their own keys, no vendor lock-in
- **Security**: Keys never stored in database, base64 encoded
- **Trade-off**: Can't use keys for server-side operations (like artifacts)

## Summary

**Models Actually Used in Production**:
1. ✅ **Chat Model** - Main conversation (user-selected, user's API key)
2. ❌ **Title Model** - Replaced with string extraction (no LLM)
3. ⚠️ **Artifact Model** - Only in test env (needs server API key)
4. ❌ **Reasoning Model** - Not implemented (future use)

**Complete Flow**:
1. User types message → Chat Model processes with full history
2. Chat Model may call tools (weather, documents, GitHub)
3. If `createDocument` called → Artifact Model generates content (test only)
4. Response streams back → Token usage calculated → Saved to DB
5. Title generated from simple string extraction (no LLM)

**Files**: 42 total (10 frontend, 19 backend, 6 database tables, 6 external APIs)
