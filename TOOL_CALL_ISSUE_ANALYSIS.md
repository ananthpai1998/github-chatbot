# Tool Call Issue Analysis

## Problem Summary

The AI model (Google Gemini) is attempting to call the `createDocument` tool but encountering a `SyntaxError`. The model appears to be generating tool calls in an incorrect format that results in Python syntax errors.

---

## Key Findings from Debug Logs

### 1. Tool Structure Verification Issue

```
[Chat API] Tool "createDocument": {
  exists: true,
  type: 'object',
  hasDescription: true,
  hasParameters: false,  ❌
  hasExecute: true
}
```

**Finding**: The verification shows `hasParameters: false` for all custom tools (createDocument, updateDocument, requestSuggestions).

**Explanation**: This is NOT actually causing the tool call failure. The AI SDK v5's `tool()` function returns a `CoreTool` object where `parameters` is stored internally and not directly accessible via property access. The tools are still correctly structured internally - the verification just can't see the property from outside.

### 2. Provider Tools Issue

```
[Chat API] Tool "google_search": {
  exists: true,
  type: 'object',
  hasDescription: false,  ❌
  hasParameters: false,  ❌
  hasExecute: false  ❌
}
[Chat API] Tool "url_context": {
  exists: true,
  type: 'object',
  hasDescription: false,  ❌
  hasParameters: false,  ❌
  hasExecute: false  ❌
}
```

**Finding**: Google's built-in SDK tools (`google_search`, `url_context`) have a completely different structure than custom tools.

**Explanation**: These are created by `google.tools.googleSearch()` and `google.tools.urlContext()` from Google's SDK, not the AI SDK's `tool()` function. They have an internal structure that the verification cannot access. This is normal and expected.

### 3. Actual Problem: SyntaxError

Based on your description, the AI model is generating output that results in:
- "NameError: createDocument is not defined"
- SyntaxError at various lines
- The model trying to use Python syntax to call the tool

**Root Cause**: The model is confused about HOW to call the tool. It's generating Python-like syntax instead of proper tool call format.

---

## Why This Happens

### 1. **Conflicting Capabilities**

You have **code execution** enabled for Google Gemini models. The model sees:
- `code_execution` tool in the tools list
- System prompt mentions "Run Python code"
- createDocument tool for creating artifacts

The model might be trying to use Python code execution to call createDocument, which doesn't work.

### 2. **Tool Call Format Confusion**

Google Gemini models expect tool calls in a specific format. If the tool definition or system prompt is unclear, the model might:
- Try to write Python code that calls the tool
- Mix tool calls with conversational text
- Generate malformed tool call JSON

### 3. **System Prompt Overload**

The system prompt includes:
- Agent instructions (artifacts prompt)
- Model base prompt (Google-specific)
- Capability prompts (thinking, code execution, etc.)
- Tool-specific prompts (createDocument usage)

Too many instructions might cause confusion about when to use which capability.

---

## Diagnostic Steps

### Step 1: Check Tool Structure in Detail

Run the app and look for this log (we added it):

```
[Chat API] createDocument full structure: {
  // This will show the actual tool object structure
}
```

This will reveal if the tool is properly structured internally.

### Step 2: Check streamText Call

Look for these logs:

```
[Chat API] About to call streamText with: { ... }
[Chat API] streamText call successful, result object created
[Chat API] Stream consumption started
```

If you see an error between "About to call" and "successful", the issue is in the streamText setup.

### Step 3: Check Model Response

When the AI tries to call createDocument, look for:

```
[createDocument Tool] EXECUTE CALLED! { ... }
```

**If you see this**: Tool call reached the execute function → issue is IN the tool execution
**If you DON'T see this**: Tool call never reached execution → issue is in how the model is calling the tool

---

## Potential Solutions

### Solution 1: Simplify Tool Configuration

**Problem**: Too many tools and capabilities might confuse the model.

**Action**: Temporarily disable provider tools to isolate the issue:

1. Go to Admin → Models → Edit Gemini 2.5 Pro
2. Disable:
   - Code Execution
   - Web Search
   - URL Context
3. Test if createDocument works with only custom tools enabled

### Solution 2: Fix Tool Prompts

**Problem**: Tool prompts might be guiding the model to use wrong syntax.

**Action**: Check the createDocument tool prompt in Admin → Tools → Edit Tool:

**Current description** (from your config):
```
Creates artifacts that appear in a dedicated panel. Use for documents, Mermaid diagrams, code, or spreadsheets. When user asks for 'diagram' or 'flowchart', use kind='text' with Mermaid syntax.
```

**Better description** (more explicit):
```
Create an artifact document that appears in the UI panel.

USAGE:
- For diagrams/flowcharts: Use kind="text" and write Mermaid diagram syntax
- For code: Use kind="code"
- For spreadsheets: Use kind="spreadsheet"

CALL FORMAT:
{
  "title": "Document Title",
  "kind": "text" | "code" | "spreadsheet"
}

Do NOT use Python code to call this tool. Use it as a direct tool call.
```

### Solution 3: Check for Tool Call Interception

**Problem**: Google provider might be intercepting or modifying tool calls.

**Action**: Add logging to see what the model actually generates before execution.

Add this after streamText call:

```typescript
result.onStepFinish((step) => {
  console.log("[Chat API] Step finished:", {
    type: step.type,
    toolCalls: step.toolCalls,
    toolResults: step.toolResults,
  });
});
```

### Solution 4: Verify Input Schema

**Problem**: The tool input schema might not match what Google expects.

**Action**: Check if artifactKinds is properly defined:

```typescript
// In lib/artifacts/server.ts
console.log("[Artifacts] Available kinds:", artifactKinds);
```

Expected output:
```
["text", "code", "spreadsheet"]
```

If this is wrong, the z.enum() will fail validation.

### Solution 5: Check Model Configuration

**Problem**: The model might not support tools properly.

**Action**: Verify in Admin → Models → Edit Gemini 2.5 Pro:
- `supportsTools`: Should be `true` (or not set, defaults to true)
- Check if there are any custom provider configs that might affect tool behavior

---

## Immediate Next Steps

1. **Test with simplified configuration**:
   ```
   - Keep: createDocument, updateDocument, requestSuggestions
   - Disable: code_execution, google_search, url_context
   ```

2. **Run the app and check logs**:
   ```bash
   npm run dev
   ```

3. **Send a test message**:
   ```
   "Create a simple flowchart with two steps"
   ```

4. **Look for these specific logs**:
   ```
   [Chat API] === FINAL ACTIVE TOOLS ===
   [Chat API] Active tool names: [...]
   [Chat API] createDocument full structure: {...}
   [Chat API] About to call streamText with: {...}
   [createDocument Tool] EXECUTE CALLED!
   ```

5. **If error occurs, capture**:
   - The exact error message
   - The stack trace
   - What the model generated (visible in UI or console)

---

## Understanding Tool Call Flow

### Correct Flow:

```
User: "create a diagram"
  ↓
Model receives:
  - System prompt with createDocument instructions
  - Tool definition with parameters
  - User message
  ↓
Model generates:
  - Tool call request: createDocument({ title: "...", kind: "text" })
  ↓
AI SDK intercepts:
  - Validates parameters against schema
  - Calls tool.execute({ title, kind })
  ↓
Tool executes:
  - [createDocument Tool] EXECUTE CALLED!
  - Creates document
  - Returns result
  ↓
Model receives result:
  - Generates response to user
```

### Incorrect Flow (Current Issue):

```
User: "create a diagram"
  ↓
Model receives: (same as above)
  ↓
Model generates: ❌
  - Python code: print(createDocument(...))
  - OR mixed format with conversation + tool call
  - OR malformed JSON
  ↓
AI SDK or Model: ❌
  - SyntaxError (trying to parse as Python)
  - NameError (createDocument not defined in Python context)
  - Tool never executes
```

---

## Tool Definition Check

### What AI SDK Expects:

```typescript
tool({
  description: string,
  inputSchema: z.object({...}),  // Zod schema
  execute: async (params) => {...}
})
```

This returns an object with internal structure:
```typescript
{
  description: string,
  parameters: JSONSchema,  // Converted from Zod
  execute: function,
  // Other internal properties
}
```

### What Google SDK Tools Return:

```typescript
google.tools.googleSearch({})
```

Returns Google-specific tool structure that's compatible with Google models but has different properties.

---

## Expected Debug Output

When working correctly, you should see:

```
[Chat API] ✓ Adding createDocument tool
[Chat API] createDocument config: { isEnabled: true, hasToolPrompts: true, ... }
[createDocument Tool] Initializing with config: { hasToolConfig: true, ... }

[Chat API] Agent config loaded: { enabledTools: ["createDocument", ...], ... }
[Chat API] Checking agent tool "createDocument": ✓ found
[Chat API] === FINAL ACTIVE TOOLS ===
[Chat API] Active tool names: ["createDocument", ...]

[Chat API] Tool "createDocument": {
  exists: true,
  type: 'object',
  hasDescription: true,
  hasParameters: false,  ← This is OK, internal structure
  hasExecute: true,
  actualKeys: ["description", "parameters", "execute", ...]  ← Should show parameters
}

[Chat API] createDocument full structure: {
  "description": "Creates artifacts...",
  "parameters": { "type": "object", "properties": {...} },
  ...
}

[Chat API] About to call streamText with: { ... }
[Chat API] streamText call successful, result object created

← User sends message "create a diagram" →

[createDocument Tool] EXECUTE CALLED! {
  title: "Diagram Title",
  kind: "text",
  userId: "...",
  timestamp: "..."
}
[createDocument Tool] Generated document ID: xxx
[createDocument Tool] Handler found, calling onCreateDocument...
[createDocument Tool] ✅ Document created successfully
```

---

## Questions to Answer

1. **Does the error occur during streamText setup or during model response?**
   - Check if you see "streamText call successful" before the error

2. **What does the model actually generate?**
   - Is it proper tool call JSON?
   - Is it Python code?
   - Is it mixed format?

3. **Are the tool parameters accessible?**
   - Check the "actualKeys" in tool verification
   - Check the "createDocument full structure" log

4. **Does it work with other tools?**
   - Try getWeather (simpler tool)
   - Compare behavior

5. **Does it work with thinking disabled?**
   - Disable thinking capability temporarily
   - Test if complexity is the issue

---

## Next Steps

1. Run the app with all the new debug logging
2. Try to create a diagram
3. Capture ALL console output from the moment you send the message
4. Share the complete log output
5. Note exactly what the AI shows in the UI when it fails

This will help us pinpoint whether the issue is:
- Tool structure (unlikely based on current evidence)
- Model confusion about tool calling syntax (most likely)
- Provider options interfering
- System prompt causing wrong behavior
- Input schema validation failing

The debug logs we added will make the exact failure point clear.
