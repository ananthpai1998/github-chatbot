# Debug Guide - Chat Not Working Issue

## Overview
Comprehensive debugging has been added to identify why chat messages aren't receiving responses.

## Debug Logs Added

### Client-Side (Browser Console)

#### 1. Chat Component Initialization
```
[Chat Client] Component initialized: {chatId, currentModel, hasApiKey, provider, isReadonly}
```
**What to check**:
- Is the correct model selected?
- Does `hasApiKey` show `true`?
- Is the provider correct (anthropic/google/openai)?

#### 2. API Key Loading
```
[API Keys] Loaded from localStorage: {hasAnthropic, hasGoogle, hasOpenAI}
[API Keys] getAPIKey(provider): found/not found
```
**What to check**:
- Are API keys being loaded from localStorage?
- When you select a model, is the correct provider's key found?

#### 3. Message Sending
```
[Chat Client] Preparing send message request...
[Chat Client] Model config: {provider, modelId}
[Chat Client] ✅ API key found for provider: <provider>
[Chat Client] GitHub token: present/not present
[Chat Client] Request prepared: {chatId, model, hasMessage, hasApiKey, hasGithubToken}
```
**What to check**:
- Does the request preparation complete?
- Is the API key found?
- Are all required fields present?

#### 4. Streaming Response
```
[Chat Client] Data received: <type>
[Chat Client] ✅ Stream finished
```
**What to check**:
- Are you receiving data events?
- Does the stream finish?

#### 5. Errors
```
[Chat Client] ❌ Error: <error details>
```
**What to check**: Any errors during the chat flow

### Server-Side (Terminal/Server Logs)

#### 1. Request Receipt
```
[Chat API] ========== NEW CHAT REQUEST ==========
[Chat API] Request body received: {hasId, hasMessage, selectedChatModel, hasApiKey, hasGithubToken}
[Chat API] ✅ Request body validation passed
```
**What to check**:
- Is the server receiving requests?
- Does validation pass?

#### 2. Authentication
```
[Chat API] ✅ User authenticated: {userId, email}
```
**What to check**:
- Is the user authenticated?
- Is the userId a valid UUID?

#### 3. Model & Chat Setup
```
[Chat API] ✅ Model config loaded: {provider, modelId, supportsTools}
[Chat API] Chat lookup: exists/new chat
[Chat API] ✅ Chat saved to database
```
**What to check**:
- Is the model config valid?
- Does chat creation succeed?

#### 4. Message Saving
```
[Chat API] ✅ User message saved
[Chat API] Messages from DB: <count>
[Chat API] Total messages for context: <count>
```
**What to check**:
- Are messages being saved to database?
- Is the message history loaded correctly?

#### 5. Language Model Initialization
```
[Chat API] ✅ Language model initialized
[Chat API] Starting streamText with: {toolCount, activeToolsCount, messageCount}
[Chat API] Stream execute started
```
**What to check**:
- Does the language model initialize?
- Does streaming start?

#### 6. Stream Completion
```
[Chat API] Stream finished, processing usage...
```
**What to check**: Does the stream complete?

#### 7. Errors
```
[Chat API] ❌ <specific error with context>
```
**What to check**: Where exactly is the failure occurring?

## How to Debug

### Step 1: Open Browser DevTools
1. Open Chrome/Firefox DevTools (F12)
2. Go to Console tab
3. Clear console
4. Try sending a message

### Step 2: Monitor Server Logs
1. Open your terminal where `npm run dev` is running
2. Watch for `[Chat API]` logs
3. Follow the flow from request receipt to response

### Step 3: Check Common Issues

#### Issue 1: No API Key
**Client Console**:
```
[Chat Client] ❌ No API key for provider: anthropic
```
**Solution**: Add API key in Settings

#### Issue 2: User Not Authenticated
**Server Log**:
```
[Chat API] ❌ No authenticated user found
```
**Solution**: Sign out and sign back in

#### Issue 3: Database Errors
**Server Log**:
```
[Chat API] ❌ Failed to save chat: <error>
```
**Solution**: Check POSTGRES_URL environment variable

#### Issue 4: Model Initialization Fails
**Server Log**:
```
[Chat API] ❌ Failed to initialize language model
```
**Solution**:
- Check API key is valid
- Verify provider is correct
- Test API key with provider's API directly

#### Issue 5: Stream Never Starts
**No logs after**:
```
[Chat API] Stream execute started
```
**Solution**:
- Check API key validity
- Check network connectivity
- Verify model ID is correct

### Step 4: Full Debug Flow Example

**Expected Successful Flow**:

```
CLIENT:
[Chat Client] Component initialized: {chatId: "...", currentModel: "claude-3-5-sonnet-20241022", hasApiKey: true, provider: "anthropic"}
[API Keys] Loaded from localStorage: {hasAnthropic: true, hasGoogle: false, hasOpenAI: false}
[Chat Client] Preparing send message request...
[Chat Client] Model config: {provider: "anthropic", modelId: "claude-3-5-sonnet-20241022"}
[API Keys] getAPIKey(anthropic): found
[Chat Client] ✅ API key found for provider: anthropic
[Chat Client] Request prepared: {chatId: "...", model: "claude-3-5-sonnet-20241022", hasMessage: true, hasApiKey: true}
[Chat Client] Data received: message
[Chat Client] Data received: data-usage
[Chat Client] ✅ Stream finished

SERVER:
[Chat API] ========== NEW CHAT REQUEST ==========
[Chat API] Request body received: {hasId: true, hasMessage: true, selectedChatModel: "claude-3-5-sonnet-20241022", hasApiKey: true}
[Chat API] ✅ Request body validation passed
[Chat API] Processing chat: {chatId: "...", model: "claude-3-5-sonnet-20241022", messageId: "..."}
[Chat API] ✅ Model config loaded: {provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", supportsTools: true}
[Chat API] ✅ User authenticated: {userId: "...", email: "user@example.com"}
[Chat API] Message count (24h): 1
[Chat API] Chat lookup: new chat
[Chat API] Creating new chat...
[Chat API] Generated title: "New conversation"
[Chat API] ✅ Chat saved to database
[Chat API] Messages from DB: 0
[Chat API] Total messages for context: 1
[Chat API] ✅ User message saved
[Chat API] Stream ID created: "..."
[Chat API] Creating UI message stream...
[Chat API] Stream execute started
[Chat API] Initializing language model... {isTest: false, provider: "anthropic", modelId: "claude-3-5-sonnet-20241022"}
[Chat API] ✅ Language model initialized
[Chat API] Starting streamText with: {toolCount: 4, activeToolsCount: 4, messageCount: 1}
[Chat API] Stream finished, processing usage...
```

## Quick Checklist

Before testing, verify:
- [ ] User is signed in (check browser DevTools > Application > Cookies)
- [ ] API key is saved (check browser Console for API Keys logs)
- [ ] Database is accessible (POSTGRES_URL in .env.local)
- [ ] Supabase is configured (check .env.local)
- [ ] Running in dev mode: `npm run dev`
- [ ] Browser console is open (F12)
- [ ] Terminal is visible to see server logs

## Next Steps

1. **Start the dev server**: `npm run dev`
2. **Open browser**: http://localhost:3000
3. **Open DevTools**: Press F12
4. **Clear console**: Click clear button
5. **Sign in**: Use email/password or GitHub OAuth
6. **Add API key**: Go to Settings → Add your API key
7. **Send a message**: Try sending "Hello"
8. **Watch both consoles**: Browser console and terminal
9. **Report back**: Share where the logs stop or what error appears

## Common Error Patterns

### Pattern 1: Stuck at "submitted" status
**Logs show**: Request prepared but no server logs
**Cause**: Network issue or server not running
**Fix**: Check `npm run dev` is running

### Pattern 2: "Please wait for model to finish"
**Logs show**: Stream execute started but never finishes
**Cause**: Model API call hanging
**Fix**: Check API key, check provider API status

### Pattern 3: Immediate error after send
**Logs show**: Error in prepareSendMessagesRequest
**Cause**: Missing API key or invalid model
**Fix**: Verify API key in settings

### Pattern 4: Database errors
**Logs show**: Failed to save chat/message
**Cause**: Database connection issue
**Fix**: Check POSTGRES_URL, verify database is running
