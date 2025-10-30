# Complete Prompt System Implementation

## Overview

This document describes the complete implementation of the prompt system that ensures all prompts from the Admin Panel (Models, Agents, and Tools tabs) are properly integrated into the chat API.

---

## System Architecture

### Prompt Flow

```
User Message
    ↓
Chat API (route.ts)
    ↓
[1] Load Agent Config (chatModel)
    - System Prompt from Agent
    - Enabled Tools list
    ↓
[2] Load Model Config (e.g., gemini-2.5-pro)
    - Tool Prompts (base, thinking, fileInput, etc.)
    - Capabilities
    - Provider Config
    ↓
[3] Load Tool Configs
    - Tool-specific prompts (description, usageGuidelines, examples)
    - Enable/disable status
    ↓
[4] Build Complete System Prompt
    = Agent System Prompt
    + Request Hints (location info)
    + Model Base Tool Prompt (Google-specific)
    + Capability Prompts (thinking, fileInput, codeExecution, webSearch, urlContext)
    + Tool-Specific Prompts (for enabled tools)
    ↓
[5] Filter Tools
    - Only globally enabled tools
    - Only agent-enabled tools
    - Provider-specific tools
    ↓
[6] Send to AI Model
    - Complete system prompt
    - Filtered tools
    - User messages
```

---

## Component Breakdown

### 1. Agent Configuration (AgentConfig table)

**Location**: Admin Panel → Agents Tab → Edit Agent

**Fields Used**:
- `systemPrompt`: Base instructions for the agent role
- `enabledTools`: List of tool IDs this agent can use

**Example (chatModel agent)**:
```
systemPrompt: "You are a friendly assistant! Keep your responses concise and helpful.

# ARTIFACT TOOL CAPABILITIES
You have FULL ACCESS to artifact creation tools...
[artifacts prompt]"

enabledTools: ["createDocument", "updateDocument", "requestSuggestions", "getWeather", "github_tools"]
```

### 2. Model Configuration (ModelConfig table)

**Location**: Admin Panel → Models Tab → Edit Model

**Fields Used**:
- `toolPrompts.base`: Provider-specific base instructions (e.g., Google Gemini specific)
- `toolPrompts.thinking`: Instructions for thinking capability
- `toolPrompts.fileInput`: Instructions for file processing
- `toolPrompts.codeExecution`: Instructions for code execution
- `toolPrompts.webSearch`: Instructions for web search
- `toolPrompts.urlContext`: Instructions for URL analysis
- `capabilities`: Which features are enabled for this model
- `providerConfig`: Provider-specific settings (e.g., Google safety settings)

**Example (gemini-2.5-pro)**:
```json
{
  "toolPrompts": {
    "base": "You are an advanced AI assistant powered by Google Gemini...",
    "thinking": "## Extended Thinking Capabilities...",
    "fileInput": "## File Processing Capabilities...",
    "codeExecution": "## Python Code Execution...",
    "webSearch": "## Google Search Grounding...",
    "urlContext": "## URL Context Analysis..."
  },
  "capabilities": {
    "thinking": { "enabled": true, "budgetTokens": 8192 },
    "fileInputs": { "enabled": true },
    "codeExecution": { "enabled": true },
    "webSearch": { "enabled": true },
    "urlContext": { "enabled": true }
  }
}
```

### 3. Tool Configuration (ToolConfig table)

**Location**: Admin Panel → Tools Tab → Edit Tool → Tool Prompts

**Fields Used**:
- `isEnabled`: Global enable/disable
- `toolPrompts.description`: What the tool does
- `toolPrompts.usageGuidelines`: When and how to use it
- `toolPrompts.examples`: Example usage scenarios

**Example (createDocument)**:
```json
{
  "isEnabled": true,
  "toolPrompts": {
    "description": "Creates artifacts that appear in a dedicated panel. Use for documents, Mermaid diagrams, code, or spreadsheets. When user asks for 'diagram' or 'flowchart', use kind='text' with Mermaid syntax.",
    "usageGuidelines": "ALWAYS use this tool when user requests: diagrams, flowcharts, documents, code examples, or data tables. For diagrams, use kind='text' and write Mermaid syntax. Do not say you cannot create these - you have the tool to do so.",
    "examples": "User: 'create a flowchart' → Call createDocument with kind='text', then generate Mermaid flowchart syntax. User: 'write code to sort array' → Call createDocument with kind='code', then generate Python code."
  }
}
```

---

## Implementation Details

### File: `app/(chat)/api/chat/route.ts`

**Lines 411-450**: Build system prompt

```typescript
// 1. Load agent config
const agentConfig = await getAgentById("chatModel");
const agentBasePrompt = agentConfig?.systemPrompt || defaultPrompt;

// 2. Add request hints (location)
const requestPrompt = getRequestPromptFromHints(requestHints);
const agentPromptWithHints = `${agentBasePrompt}\n\n${requestPrompt}`;

// 3. Add model-specific base prompt (Google-specific instructions)
const modelToolPromptBase = dbModelConfig?.toolPrompts?.base;
const baseWithModel = modelToolPromptBase
  ? `${agentPromptWithHints}\n\n${modelToolPromptBase}`
  : agentPromptWithHints;

// 4. Build capability prompts (thinking, fileInput, etc.)
const toolPromptAdditions = buildToolPrompts(
  dbModelConfig.capabilities,
  dbModelConfig.toolPrompts,
  userThinkingEnabled
);

// 5. Add tool-specific prompts for enabled tools
const toolSpecificPrompts = [];
for (const toolId of activeToolNames) {
  const toolCfg = toolConfigMap.get(toolId);
  if (toolCfg?.toolPrompts) {
    toolSpecificPrompts.push(formatToolPrompt(toolCfg));
  }
}

if (toolSpecificPrompts.length > 0) {
  toolPromptAdditions.push(`\n## Available Tools\n\n${toolSpecificPrompts.join('\n\n')}`);
}

// 6. Combine everything
const enhancedSystemPrompt = toolPromptAdditions.length > 0
  ? `${baseWithModel}\n\n${toolPromptAdditions.join("\n\n")}`
  : baseWithModel;
```

**Lines 380-397**: Filter tools based on agent and global settings

```typescript
// Filter tools: must be globally enabled AND agent-enabled
if (agentConfig?.enabledTools && agentConfig.enabledTools.length > 0) {
  const agentToolNames = agentConfig.enabledTools.filter(
    (toolName) => toolName in allTools && toolConfigMap.get(toolName)?.isEnabled !== false
  );
  activeToolNames = [...agentToolNames, ...providerToolNames];
}
```

---

## Final System Prompt Structure

When a chat request is processed, the final system prompt includes:

```
1. AGENT SYSTEM PROMPT
   "You are a friendly assistant!..."
   [Includes artifacts prompt about createDocument/updateDocument]

2. REQUEST HINTS
   "About the origin of user's request:
   - lat: ...
   - lon: ...
   - city: ...
   - country: ..."

3. MODEL BASE PROMPT (if Google model)
   "You are an advanced AI assistant powered by Google Gemini with access to powerful tools..."

4. CAPABILITY PROMPTS (based on model capabilities)
   - "## Extended Thinking Capabilities..." (if thinking enabled)
   - "## File Processing Capabilities..." (if fileInputs enabled)
   - "## Python Code Execution..." (if codeExecution enabled)
   - "## Google Search Grounding..." (if webSearch enabled)
   - "## URL Context Analysis..." (if urlContext enabled)

5. TOOL-SPECIFIC PROMPTS (for enabled tools)
   "## Available Tools

   **Create Document**: Creates artifacts that appear in a dedicated panel...
   Usage: ALWAYS use this tool when user requests diagrams...
   Examples: User: 'create a flowchart' → Call createDocument...

   **Update Document**: Updates existing documents/artifacts...
   Usage: Use when user asks to modify...
   Examples: User: 'update the diagram' → Call updateDocument...

   **Request Suggestions**: Generates AI-powered editing suggestions...
   Usage: Use when user asks for suggestions...
   Examples: User: 'suggest improvements' → Call requestSuggestions..."
```

---

## Verification

### Check Configuration

Run: `npx tsx scripts/verify-config.ts`

Expected output:
```
=== AGENT CONFIG ===
Agent: Chat Model
System Prompt Length: 1691
Enabled Tools: ["createDocument", "updateDocument", ...]
Includes artifacts prompt: true

=== MODEL CONFIG ===
Model: Gemini 2.5 Pro
Has toolPrompts.base: true
Base prompt length: 1602

=== TOOL CONFIGS ===
createDocument:
  Enabled: true
  Has prompts: true
    - description: true (193 chars)
    - usageGuidelines: true (225 chars)
    - examples: true (206 chars)
...

=== SUMMARY ===
✓ Agent has system prompt: true
✓ Model has base tool prompt: true
✓ Tools with prompts: 3/5
```

### Test in Chat

1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Select "Gemini 2.5 Pro" model
4. Ask: "create a flowchart for user authentication"
5. Check console logs for `[Chat API] === FULL SYSTEM PROMPT ===`
6. Verify the AI calls `createDocument` tool

---

## Database Schema

### AgentConfig
```sql
CREATE TABLE "AgentConfig" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  "systemPrompt" text NOT NULL,
  "enabledTools" text[] DEFAULT ARRAY[]::text[],
  ...
);
```

### ModelConfig
```sql
CREATE TABLE "ModelConfig" (
  "id" text PRIMARY KEY,
  "provider" text NOT NULL,
  "name" text NOT NULL,
  "toolPrompts" jsonb,  -- { base, thinking, fileInput, codeExecution, webSearch, urlContext }
  "capabilities" jsonb,
  "providerConfig" jsonb,
  ...
);
```

### ToolConfig
```sql
CREATE TABLE "ToolConfig" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  "isEnabled" boolean DEFAULT true,
  "toolPrompts" jsonb,  -- { description, usageGuidelines, examples }
  ...
);
```

---

## Scripts

### Update Tool Prompts
```bash
npx tsx scripts/update-tool-prompts.ts
```
Adds/updates toolPrompts for createDocument, updateDocument, requestSuggestions.

### Seed Google Prompts
```bash
npx tsx scripts/seed-google-prompts.ts
```
Adds Google-specific prompts to all Gemini models.

### Verify Configuration
```bash
npx tsx scripts/verify-config.ts
```
Checks agent, model, and tool configurations.

---

## Key Features

✅ **Agent System Prompts**: Fully integrated from database
✅ **Model Tool Prompts**: Provider-specific instructions included
✅ **Capability Prompts**: Dynamic based on model capabilities
✅ **Tool-Specific Prompts**: Detailed instructions for each tool
✅ **Two-Level Tool Filtering**: Global + Agent level
✅ **Database-Driven**: All editable through Admin Panel
✅ **Fallback Support**: Works even without custom prompts
✅ **Comprehensive Logging**: Full prompt visible in console

---

## Troubleshooting

### Issue: AI not using createDocument tool

**Check**:
1. Tool is globally enabled: Admin → Tools → createDocument toggle ON
2. Tool is agent-enabled: Admin → Agents → Edit chatModel → createDocument checked
3. Agent system prompt includes artifacts instructions
4. Tool prompts are configured in database

**Fix**:
```bash
npx tsx scripts/update-tool-prompts.ts
```

### Issue: Google-specific prompts not showing

**Check**:
1. Model has toolPrompts.base in database
2. Model capabilities are set correctly

**Fix**:
```bash
npx tsx scripts/seed-google-prompts.ts
```

### Issue: System prompt is empty or incomplete

**Check console logs**:
```
[Chat API] System prompt construction: {
  hasAgentConfig: true,
  hasAgentSystemPrompt: true,
  agentPromptLength: 1691,
  hasModelToolPromptBase: true,
  modelPromptLength: 1602,
  toolPromptAdditionsCount: 6,
  finalPromptLength: 8542,
  includesArtifactsPrompt: true
}
```

All values should be `true` with lengths > 0.

---

## Summary

The system now properly combines:
1. **Agent prompts** (role and capabilities)
2. **Model prompts** (provider-specific instructions)
3. **Capability prompts** (thinking, fileInput, etc.)
4. **Tool prompts** (detailed usage instructions)

All prompts are:
- ✅ Stored in database
- ✅ Editable through Admin Panel
- ✅ Properly combined in correct order
- ✅ Visible in console logs
- ✅ Sent to AI model

**Result**: AI models receive comprehensive, detailed instructions that guide them to properly use tools like createDocument for diagrams, documents, and code.
