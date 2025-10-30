# Debug Logging Guide

## Overview

Comprehensive debug logging has been added throughout the tool system to help diagnose issues with tool loading, filtering, and execution. This guide explains all the debug logs and how to interpret them.

---

## Log Categories

### 1. Tool Configuration Loading (Chat API)

**Location**: `app/(chat)/api/chat/route.ts` (Lines 305-353)

These logs show which tools are being loaded from the database and added to the system.

```
[Chat API] ✓ Adding getWeather tool
[Chat API] ✓ Adding createDocument tool
[Chat API] createDocument config: {
  isEnabled: true,
  hasToolPrompts: true,
  description: "Creates artifacts that appear in a dedicated..."
}
[Chat API] ✓ Adding updateDocument tool
[Chat API] ✓ Adding requestSuggestions tool
[Chat API] Base tools enabled: ["getWeather", "createDocument", "updateDocument", "requestSuggestions"]
[Chat API] Base tools count: 4
```

**What to check**:
- ✓ means tool is enabled and loaded
- ✗ means tool is disabled (globally via Admin → Tools tab)
- Verify `isEnabled: true` for tools you expect to work
- Check that `hasToolPrompts: true` if you added custom prompts

---

### 2. Agent Configuration Loading (Chat API)

**Location**: `app/(chat)/api/chat/route.ts` (Lines 390-396)

Shows which agent is being used and what tools it has access to.

```
[Chat API] Agent config loaded: {
  name: "Chat Model",
  enabledTools: ["createDocument", "updateDocument", "requestSuggestions", "getWeather"],
  hasSystemPrompt: true,
  systemPromptLength: 1691
}
```

**What to check**:
- `enabledTools` should include the tools you want the agent to use
- Edit this in Admin → Agents → Edit Chat Model
- `hasSystemPrompt: true` confirms agent has custom prompt
- `systemPromptLength` should be > 0

---

### 3. Tool Filtering (Chat API)

**Location**: `app/(chat)/api/chat/route.ts` (Lines 407-431)

Shows how tools are filtered based on agent configuration.

```
[Chat API] Checking agent tool "createDocument": ✓ found
[Chat API] Checking agent tool "updateDocument": ✓ found
[Chat API] Checking agent tool "requestSuggestions": ✓ found
[Chat API] Checking agent tool "getWeather": ✓ found
[Chat API] Using agent-filtered tools: {
  agentTools: ["createDocument", "updateDocument", "requestSuggestions", "getWeather"],
  providerTools: [],
  totalActive: 4
}

[Chat API] === FINAL ACTIVE TOOLS ===
[Chat API] Active tool names: ["createDocument", "updateDocument", "requestSuggestions", "getWeather"]
[Chat API] Active tools count: 4
```

**What to check**:
- Each tool in agent's `enabledTools` should show "✓ found"
- If you see "✗ not found", the tool is in agent config but wasn't loaded (likely disabled globally)
- `agentTools` = tools available to this specific agent
- `providerTools` = provider-specific tools (code execution, web search, etc.)
- `totalActive` = final count of tools the AI can use

---

### 4. Tool Structure Verification (Chat API)

**Location**: `app/(chat)/api/chat/route.ts` (Lines 529-540)

Verifies each tool has the correct structure required by the AI SDK.

```
[Chat API] === TOOL VERIFICATION ===
[Chat API] Tool "createDocument": {
  exists: true,
  type: "object",
  hasDescription: true,
  hasParameters: true,
  hasExecute: true
}
[Chat API] Tool "updateDocument": {
  exists: true,
  type: "object",
  hasDescription: true,
  hasParameters: true,
  hasExecute: true
}
[Chat API] === END TOOL VERIFICATION ===
```

**What to check**:
- All values should be `true`
- `exists: false` means the tool object is undefined (critical error)
- `hasDescription: false` means AI won't understand what the tool does
- `hasParameters: false` means tool has no input schema (critical error)
- `hasExecute: false` means tool can't be called (critical error)

---

### 5. System Prompt Construction (Chat API)

**Location**: `app/(chat)/api/chat/route.ts` (Lines 504-518)

Shows how the complete system prompt is built.

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

[Chat API] === FULL SYSTEM PROMPT ===
You are a friendly assistant! Keep your responses concise and helpful...
[Full prompt content...]
[Chat API] === END SYSTEM PROMPT ===
```

**What to check**:
- `includesArtifactsPrompt: true` confirms createDocument instructions are in prompt
- `toolPromptAdditionsCount` should match number of active capabilities + tool prompts
- Review full system prompt to ensure all your custom prompts are included

---

### 6. Tool Initialization Logs

Each tool logs when it's initialized. This happens once when the tool is loaded.

#### createDocument Tool

**Location**: `lib/ai/tools/create-document.ts` (Lines 23-28)

```
[createDocument Tool] Initializing with config: {
  hasToolConfig: true,
  description: "Creates artifacts that appear in a dedicated panel. Use for documents, Mermaid...",
  hasUsageGuidelines: true,
  hasExamples: true
}
```

**What to check**:
- `hasToolConfig: true` means tool has custom configuration
- `hasUsageGuidelines: true` means you added usage instructions in Admin → Tools
- `hasExamples: true` means you added examples

#### updateDocument Tool

**Location**: `lib/ai/tools/update-document.ts` (Lines 19-24)

```
[updateDocument Tool] Initializing with config: {
  hasToolConfig: true,
  description: "Updates existing documents/artifacts...",
  hasUsageGuidelines: true,
  hasExamples: true
}
```

#### requestSuggestions Tool

**Location**: `lib/ai/tools/request-suggestions.ts` (Lines 24-29)

```
[requestSuggestions Tool] Initializing with config: {
  hasToolConfig: true,
  description: "Request suggestions for a document...",
  hasUsageGuidelines: true,
  hasExamples: true
}
```

---

### 7. Tool Execution Logs

These logs appear when the AI actually calls a tool. **This is the most important section for debugging tool execution issues.**

#### createDocument Execution

**Location**: `lib/ai/tools/create-document.ts` (Lines 37-109)

```
[createDocument Tool] EXECUTE CALLED! {
  title: "Authentication Flow",
  kind: "text",
  userId: "user_abc123",
  timestamp: "2025-10-29T12:34:56.789Z"
}
[createDocument Tool] Generated document ID: "doc_xyz789"
[createDocument Tool] Handler found, calling onCreateDocument...
[createDocument Tool] ✅ Document created successfully
[createDocument Tool] Returning result: {
  id: "doc_xyz789",
  title: "Authentication Flow",
  kind: "text",
  content: "A document was created and is now visible to the user."
}
```

**Error Logs**:
```
[createDocument Tool] ❌ No handler found for kind: invalidKind
[createDocument Tool] Available handlers: ["text", "code", "spreadsheet"]
```

**What to check**:
- If you don't see "EXECUTE CALLED!", the AI never invoked the tool
  - Check system prompt includes tool instructions
  - Check tool is in active tools list
  - Check user query actually needs this tool
- If you see "No handler found", the `kind` parameter is invalid
  - Valid kinds: "text", "code", "spreadsheet"
- If you see execution logs but no success, check the error message

#### updateDocument Execution

**Location**: `lib/ai/tools/update-document.ts` (Lines 35-101)

```
[updateDocument Tool] EXECUTE CALLED! {
  id: "doc_xyz789",
  description: "Add error handling section",
  userId: "user_abc123",
  timestamp: "2025-10-29T12:35:00.000Z"
}
[updateDocument Tool] Document found: {
  id: "doc_xyz789",
  title: "Authentication Flow",
  kind: "text"
}
[updateDocument Tool] Handler found, calling onUpdateDocument...
[updateDocument Tool] ✅ Document updated successfully
[updateDocument Tool] Returning result: {
  id: "doc_xyz789",
  title: "Authentication Flow",
  kind: "text",
  content: "The document has been updated successfully."
}
```

**Error Logs**:
```
[updateDocument Tool] ❌ Document not found: doc_invalid123
```

**What to check**:
- Document must exist before it can be updated
- Document ID must match exactly

#### requestSuggestions Execution

**Location**: `lib/ai/tools/request-suggestions.ts` (Lines 39-129)

```
[requestSuggestions Tool] EXECUTE CALLED! {
  documentId: "doc_xyz789",
  userId: "user_abc123",
  timestamp: "2025-10-29T12:36:00.000Z"
}
[requestSuggestions Tool] Document found: {
  id: "doc_xyz789",
  title: "Authentication Flow",
  kind: "text",
  contentLength: 543
}
[requestSuggestions Tool] Saved suggestions to database: 3
[requestSuggestions Tool] ✅ Suggestions generated successfully: {
  documentId: "doc_xyz789",
  suggestionsCount: 3
}
```

**Error Logs**:
```
[requestSuggestions Tool] ❌ Document not found or has no content: doc_invalid123
```

**What to check**:
- Document must exist and have content
- `suggestionsCount` shows how many suggestions were generated

---

## Troubleshooting Workflow

### Issue: AI doesn't call createDocument when asked to create a diagram

**Step 1**: Check tool is loaded
```
Search logs for: "[Chat API] ✓ Adding createDocument tool"
Expected: ✓ (checkmark)
If ✗: Tool is disabled in Admin → Tools tab
```

**Step 2**: Check agent has access
```
Search logs for: "[Chat API] Agent config loaded"
Expected: enabledTools includes "createDocument"
If missing: Edit agent in Admin → Agents → Edit Chat Model
```

**Step 3**: Check tool passed filtering
```
Search logs for: "[Chat API] Checking agent tool \"createDocument\""
Expected: "✓ found"
If "✗ not found": Tool is in agent config but not loaded (check Step 1)
```

**Step 4**: Check tool in final active list
```
Search logs for: "[Chat API] === FINAL ACTIVE TOOLS ==="
Expected: Active tool names includes "createDocument"
If missing: Previous steps failed
```

**Step 5**: Check tool structure
```
Search logs for: "[Chat API] Tool \"createDocument\":"
Expected: All properties are true
If any false: Tool definition is broken (code issue)
```

**Step 6**: Check system prompt includes tool instructions
```
Search logs for: "[Chat API] === FULL SYSTEM PROMPT ==="
Expected: Prompt includes "createDocument" and usage instructions
If missing: Check Admin → Tools → Edit Tool → Tool Prompts
```

**Step 7**: Check if AI called the tool
```
Search logs for: "[createDocument Tool] EXECUTE CALLED!"
Expected: This log appears after user sends message
If missing: AI chose not to use the tool (prompt issue or user query issue)
If present: Tool was called, check execution logs for errors
```

---

### Issue: Tool execution fails

**Check for error logs**:
```
Search logs for: "❌"
Common errors:
- "Document not found" → Invalid ID or document doesn't exist
- "No handler found for kind" → Invalid kind parameter
- "Error in document handler" → Internal error, check stack trace
```

**Check execution flow**:
```
createDocument flow:
1. [createDocument Tool] EXECUTE CALLED!
2. [createDocument Tool] Generated document ID: xxx
3. [createDocument Tool] Handler found, calling onCreateDocument...
4. [createDocument Tool] ✅ Document created successfully
5. [createDocument Tool] Returning result: {...}

If flow stops at any step, check the error at that step.
```

---

## Log Level Guide

| Symbol | Meaning | Action Required |
|--------|---------|-----------------|
| ✓ | Success | None |
| ✗ | Disabled/Not Found | Check configuration |
| ❌ | Error | Fix the issue |
| === | Section Marker | For reading clarity |

---

## Testing Checklist

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Open browser console** (F12) and **terminal** where dev server is running

3. **Send test message**: "create a flowchart for user authentication"

4. **Check logs appear** in order:
   - [ ] Tool loading logs
   - [ ] Agent config logs
   - [ ] Tool filtering logs
   - [ ] Final active tools logs
   - [ ] Tool verification logs
   - [ ] System prompt logs
   - [ ] Tool initialization logs (once per server start)
   - [ ] Tool execution logs (when AI calls tool)

5. **Verify createDocument was called**:
   - [ ] See "[createDocument Tool] EXECUTE CALLED!"
   - [ ] See "[createDocument Tool] ✅ Document created successfully"
   - [ ] Artifact appears in UI

---

## Common Issues and Solutions

### Tool not in active list

**Cause**: Tool is disabled globally or not in agent config

**Solution**:
1. Admin → Tools → Check toggle is ON
2. Admin → Agents → Edit Chat Model → Check tool is checked

### Tool in active list but AI doesn't call it

**Cause**: Missing or unclear tool prompts

**Solution**:
1. Admin → Tools → Edit Tool → Tool Prompts
2. Add clear description, usage guidelines, and examples
3. Check system prompt includes these prompts

### Tool called but execution fails

**Cause**: Invalid parameters or internal error

**Solution**:
1. Check execution logs for error message
2. Verify input parameters match expected format
3. Check document exists (for updateDocument/requestSuggestions)

### No execution logs at all

**Cause**: AI never invoked the tool

**Solution**:
1. Check user query clearly needs the tool
2. Verify system prompt includes tool instructions
3. Try rephrasing the user query to be more explicit
4. Check model supports tools (modelConfig.supportsTools !== false)

---

## Next Steps

After reviewing logs:

1. **If tool loading fails**: Check database configuration
2. **If tool filtering fails**: Check agent configuration
3. **If tool structure fails**: Check tool implementation code
4. **If AI doesn't call tool**: Check system prompt and tool prompts
5. **If execution fails**: Check error logs and fix the specific issue

Use this guide to systematically diagnose any tool-related issues!
