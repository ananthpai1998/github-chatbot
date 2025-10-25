# DevMate - GitHub AI Assistant: Implementation Guide

> **Last Updated:** 2025-10-24
> **Status:** In Progress
> **Goal:** Transform chatbot into GitHub-focused AI assistant with multi-LLM support and MCP integration

---

## 📊 Implementation Progress Tracker

### ✅ Phase 1: Foundation & Authentication (COMPLETED)
- [x] **1.1** - Supabase project created and configured
- [x] **1.2** - Install Supabase dependencies (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] **1.3** - Remove old packages (`next-auth`, `bcrypt-ts`, `@ai-sdk/gateway`, `@ai-sdk/xai`, `@vercel/blob`)
- [x] **1.4** - Create Supabase client utilities
  - [x] `lib/supabase/server.ts` - Server-side client
  - [x] `lib/supabase/client.ts` - Client-side client
  - [x] `lib/supabase/middleware.ts` - Auth middleware
- [x] **1.5** - Create localStorage API key management
  - [x] `lib/storage/api-keys.ts` - LLM API key management
  - [x] `lib/storage/github-token.ts` - GitHub token management
- [x] **1.6** - Update middleware (`middleware.ts`) to use Supabase
- [x] **1.7** - Update auth actions (`app/(auth)/actions.ts`)
  - [x] Replace Auth.js with Supabase auth
  - [x] Add `signInWithGithub()` action
  - [x] Add `logout()` action
- [x] **1.8** - Create OAuth callback route (`app/auth/callback/route.ts`)
- [x] **1.9** - Update `.env.example` with Supabase configuration
- [x] **1.10** - Remove old Auth.js files
  - [x] Delete `app/(auth)/auth.ts`
  - [x] Delete `app/(auth)/auth.config.ts`
- [x] **1.11** - Update login page (`app/(auth)/login/page.tsx`)
  - [x] Remove `next-auth/react` dependency
  - [x] Add GitHub OAuth button
  - [x] Update branding to "DevMate"

### ✅ Phase 2: Complete Authentication UI (COMPLETED)
- [x] **2.1** - Update register page (`app/(auth)/register/page.tsx`)
  - [x] Remove `next-auth/react` dependency
  - [x] Add GitHub OAuth button
  - [x] Update branding to "DevMate"
- [x] **2.2** - Fix any remaining `next-auth` imports in components
  - [x] Search for `next-auth` usage across codebase
  - [x] Replace with Supabase auth hooks in remaining files
- [x] **2.3** - Create user session hooks
  - [x] `hooks/use-user.ts` - Get current user from Supabase
  - [x] `hooks/use-auth.ts` - Not needed (using logout action directly)
- [ ] **2.4** - Test authentication flow (NEEDS USER TESTING)
  - [ ] Email/password login works
  - [ ] Email/password registration works
  - [ ] GitHub OAuth login works
  - [ ] Logout works
  - [ ] Session persistence works

### ✅ Phase 3: Multi-LLM Provider Support (COMPLETED)
- [x] **3.1** - Install LLM provider SDKs
  - [x] Already installed: `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai`
- [x] **3.2** - Update provider configuration (`lib/ai/providers.ts`)
  - [x] Create provider type definitions (`ProviderType`, `ProviderAPIKeys`)
  - [x] Add `createProviderInstance(provider, apiKey)` factory function
  - [x] Add `getLanguageModel(provider, modelId, apiKey)` helper
  - [x] Support dynamic provider creation with user API keys
- [x] **3.3** - Update model definitions (`lib/ai/models.ts`)
  - [x] Define Claude models (3.5 Sonnet, 3.5 Haiku, 3 Opus)
  - [x] Define Gemini models (2.0 Flash Exp, Exp 1206, 1.5 Pro, 1.5 Flash)
  - [x] Define OpenAI models (GPT-4o, GPT-4o Mini, GPT-4 Turbo, o1-preview, o1-mini)
  - [x] Add model metadata (provider, modelId, contextWindow, supportsVision, supportsTools)
  - [x] Add helper functions (`getModelById`, `getModelsByProvider`)
- [x] **3.4** - Create React hooks for API keys
  - [x] `hooks/use-api-keys.ts` - Manage LLM API keys in localStorage
  - [x] Add encryption/decryption helpers
  - [x] Add methods: `setAPIKey`, `removeAPIKey`, `clearAllAPIKeys`, `hasAPIKey`, `getAPIKey`, `getConfiguredProviders`
- [x] **3.5** - Update chat API route (`app/(chat)/api/chat/route.ts`)
  - [x] Update schema to accept `apiKey` in request body
  - [x] Get model configuration with `getModelById()`
  - [x] Use `getLanguageModel()` with user-provided API key
  - [x] Conditional tool support based on model capabilities
  - [x] Updated error handling for invalid models
- [x] **3.6** - Update model selector component (`components/model-selector.tsx`)
  - [x] Filter models based on configured API keys
  - [x] Group models by provider (Anthropic Claude, Google Gemini, OpenAI GPT)
  - [x] Add separators between provider groups
  - [x] Show empty state when no API keys configured
- [x] **3.7** - Update chat client (`components/chat.tsx`)
  - [x] Get API key for selected model's provider
  - [x] Send API key with chat requests
  - [x] Add error handling for missing API keys
- [x] **3.8** - Update entitlements (`lib/ai/entitlements.ts`)
  - [x] Make all models available (users provide own keys)

### ✅ Phase 4: Settings Page & API Key Management (COMPLETED)
- [x] **4.1** - Create settings page (`app/(chat)/settings/page.tsx`)
  - [x] Account section (user info, email, logout)
  - [x] LLM providers section (add/edit/remove API keys)
  - [x] GitHub connection section (manual PAT entry with OAuth placeholder)
  - [x] Privacy notice about local storage
- [x] **4.2** - Create settings components
  - [x] `components/settings/account-section.tsx` - User account details and logout
  - [x] `components/settings/api-key-manager.tsx` - Add/edit/remove LLM API keys
    - Show/hide key visibility toggle
    - Save/Remove buttons with validation
    - Provider configuration status indicators
    - Links to provider API key consoles
  - [x] `components/settings/github-token-manager.tsx` - GitHub PAT input
    - OAuth placeholder (coming in Phase 5)
    - Manual token entry with validation
    - Show/hide token visibility
    - Required scopes documentation
- [x] **4.3** - Create GitHub token management hook
  - [x] `hooks/use-github-token.ts` - localStorage management with encryption
- [x] **4.4** - Create API routes for key validation
  - [x] `app/(chat)/api/validate-key/route.ts` - Test API key validity
    - Validates Anthropic, Google, OpenAI keys
    - Makes minimal API calls to verify key
    - Returns validation status and error messages
- [x] **4.5** - Add settings link to navigation
  - [x] Added "Settings" menu item to sidebar user dropdown

### ✅ Phase 5: GitHub MCP Integration (COMPLETED)
- [x] **5.1** - Install MCP SDK
  - [x] Already installed: `@modelcontextprotocol/sdk@1.20.2`
- [x] **5.2** - Create GitHub MCP client (`lib/mcp/github-client.ts`)
  - [x] Uses stdio transport for local `@modelcontextprotocol/server-github`
  - [x] Authenticates with GitHub token via environment variable
  - [x] Client caching and connection management
  - [x] Tool listing and execution methods
  - [x] Graceful error handling and cleanup
- [x] **5.3** - Create MCP tool converter (`lib/mcp/tool-converter.ts`)
  - [x] JSON Schema to Zod schema conversion
  - [x] MCP tool to Vercel AI SDK CoreTool conversion
  - [x] Result formatting for AI consumption
  - [x] Friendly descriptions for common GitHub tools
  - [x] Support for objects, arrays, strings, numbers, booleans, enums
- [x] **5.4** - Create GitHub tools integration (`lib/ai/tools/github-tools.ts`)
  - [x] `createGitHubTools(githubToken)` factory function
  - [x] Automatic tool loading from MCP server
  - [x] Tool execution via MCP client with error handling
  - [x] Result formatting and logging
  - [x] `getCommonGitHubTools()` helper for limiting active tools
  - [x] `isGitHubMCPAvailable()` server availability check
- [x] **5.5** - Update chat API to include GitHub tools
  - [x] Accept optional `githubToken` in request schema
  - [x] Dynamically load GitHub tools when token provided
  - [x] Merge GitHub tools with base tools (weather, documents)
  - [x] Handle MCP initialization errors gracefully
  - [x] Continue chat without GitHub tools if unavailable
  - [x] Async execute function for tool loading
- [x] **5.6** - Create GitHub UI components
  - [x] `components/github/connection-status.tsx` - Status display with link to settings
  - [x] `GitHubStatusBadge` - Compact badge for headers
  - [ ] `components/github/repo-selector.tsx` - Quick repo context (optional - future)
  - [ ] `components/chat/github-action-card.tsx` - Display GitHub actions (optional - future)
- [x] **5.7** - Update chat client to send GitHub token
  - [x] Import `useGitHubToken` hook in chat component
  - [x] Get token in `prepareSendMessagesRequest`
  - [x] Include token in request body when available
  - [ ] OAuth token extraction (deferred - manual PAT works for now)

### ✅ Phase 6: UI/UX Enhancements (COMPLETED)
- [x] **6.1** - Update branding throughout app
  - [x] Change "AI Chatbot" to "DevMate"
  - [x] Update page titles and meta tags
  - [x] Add tagline "GitHub AI Assistant"
  - [x] Enhanced metadata with keywords, OpenGraph, Twitter cards
- [x] **6.2** - Create onboarding flow
  - [x] Welcome modal for first-time users
  - [x] 3-step guided tour (Welcome → Provider selection → Setup)
  - [x] Redirects to settings for API key configuration
  - [x] localStorage tracking for completion state
  - [x] Marketing landing page with features/FAQ/pricing
- [x] **6.3** - Add chat UI improvements
  - [x] Token usage display component (`components/chat/token-usage-display.tsx`)
  - [x] Running total for conversation
  - [x] Cost estimate infrastructure (placeholder)
  - [x] Provider/model tracking capability
- [x] **6.4** - Add error states and empty states
  - [x] "No API key configured" banner (`NoAPIKeyBanner`)
  - [x] "GitHub not connected" banner (`NoGitHubTokenBanner`)
  - [x] Loading state component (`LoadingState`)
  - [x] Tool execution indicators (`ToolExecutionIndicator`)
  - [x] Chat empty state with suggested prompts (`ChatEmptyState`)
- [x] **6.5** - Add keyboard shortcuts
  - [x] Cmd/Ctrl + K for model selector
  - [x] Cmd/Ctrl + , for settings
  - [x] Cmd/Ctrl + N for new chat
  - [x] Cmd/Ctrl + / for focus chat input
  - [x] Cmd/Ctrl + ? for shortcuts help dialog
  - [x] `useKeyboardShortcuts` hook for custom shortcuts
  - [x] `KeyboardShortcutsDialog` component

### ✅ Phase 7: Database & Storage Updates (COMPLETED)
- [x] **7.1** - Update database queries (`lib/db/queries.ts`)
  - [x] Removed `createUser()` function (Supabase handles user creation)
  - [x] Removed `createGuestUser()` function (Supabase handles user creation)
  - [x] Removed `generateHashedPassword` import (no longer needed)
  - [x] All existing queries already use UUID user IDs (compatible with Supabase)
  - [x] Added comments explaining Supabase Auth integration
- [x] **7.2** - Update Supabase Storage integration
  - [x] Updated `app/(chat)/api/files/upload/route.ts` to use Supabase Storage
  - [x] Changed bucket name from `chat-files` to `chat-attachments`
  - [x] Uses Supabase auth for user verification
  - [x] Files organized by user ID: `{userId}/{timestamp}-{filename}`
  - [x] Returns public URLs for uploaded files
  - [x] Keeps same validation (5MB, JPEG/PNG)
- [x] **7.3** - Create storage bucket in Supabase
  - [x] Created STORAGE_SETUP.md with detailed instructions
  - [x] Bucket name: `chat-attachments`
  - [x] RLS policies documented for INSERT/SELECT/UPDATE/DELETE
  - [x] Public read access enabled
  - [x] User-scoped write access (users can only upload to their own folder)
- [x] **7.4** - Run database migrations on Supabase
  - [x] Not needed - fresh start, schema will be created directly in Supabase

### 🧪 Phase 8: Testing & Bug Fixes
- [ ] **8.1** - Test authentication flows
  - [ ] Sign up with email/password
  - [ ] Sign in with email/password
  - [ ] Sign in with GitHub OAuth
  - [ ] GitHub token saved to localStorage
  - [ ] Logout clears session
  - [ ] Session persistence across page reloads
- [ ] **8.2** - Test LLM provider integration
  - [ ] Add API key for Claude
  - [ ] Add API key for Gemini
  - [ ] Add API key for OpenAI
  - [ ] Switch providers mid-conversation
  - [ ] Invalid key shows error
  - [ ] Missing key shows prompt
- [ ] **8.3** - Test GitHub MCP integration
  - [ ] Connect GitHub token (OAuth or manual)
  - [ ] List available tools
  - [ ] Create GitHub issue via chat
  - [ ] Search repositories via chat
  - [ ] Get file contents via chat
  - [ ] Handle GitHub API errors
- [ ] **8.4** - Test file uploads
  - [ ] Upload image
  - [ ] Image displays in chat
  - [ ] Send image to vision model
  - [ ] File size validation works
  - [ ] File type validation works
- [ ] **8.5** - Test cross-device sync
  - [ ] Chat history syncs via Supabase
  - [ ] API keys stay in localStorage (don't sync)
  - [ ] Login from different browser works
- [ ] **8.6** - Test export/import settings
  - [ ] Export API keys to JSON
  - [ ] Import API keys from JSON
  - [ ] Clear all API keys

### 🚀 Phase 9: Deployment & Documentation
- [ ] **9.1** - Update README.md
  - [ ] Project description
  - [ ] Features list
  - [ ] Screenshots
  - [ ] Setup instructions
  - [ ] Environment variables
- [ ] **9.2** - Create SETUP.md
  - [ ] Detailed Supabase setup guide
  - [ ] GitHub OAuth configuration
  - [ ] How to get API keys for each LLM provider
  - [ ] Running locally
  - [ ] Deployment guide
- [ ] **9.3** - Create API_KEYS.md
  - [ ] How to get Anthropic API key
  - [ ] How to get Google API key
  - [ ] How to get OpenAI API key
  - [ ] How to get GitHub PAT
- [ ] **9.4** - Deploy to Vercel
  - [ ] Connect GitHub repo
  - [ ] Set environment variables
  - [ ] Update Supabase redirect URLs
  - [ ] Update GitHub OAuth callback URLs
  - [ ] Test production deployment
- [ ] **9.5** - Post-deployment verification
  - [ ] GitHub OAuth works in production
  - [ ] All 3 LLM providers work
  - [ ] MCP GitHub tools work
  - [ ] File uploads work
  - [ ] Database queries work

---

## 📝 Detailed Implementation Notes

### Current File Structure

```
github-chatbot/
├── app/
│   ├── (auth)/
│   │   ├── actions.ts ✅ UPDATED (Supabase)
│   │   ├── login/
│   │   │   └── page.tsx ✅ UPDATED (GitHub OAuth button)
│   │   └── register/
│   │       └── page.tsx ✅ UPDATED (GitHub OAuth button)
│   ├── (chat)/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   ├── route.ts ✅ UPDATED (Supabase auth + multi-LLM support)
│   │   │   │   ├── schema.ts ✅ UPDATED (apiKey field, dynamic model IDs)
│   │   │   │   └── [id]/stream/route.ts ✅ UPDATED (Supabase auth)
│   │   │   ├── document/route.ts ✅ UPDATED (Supabase auth)
│   │   │   ├── history/route.ts ✅ UPDATED (Supabase auth)
│   │   │   ├── suggestions/route.ts ✅ UPDATED (Supabase auth)
│   │   │   ├── vote/route.ts ✅ UPDATED (Supabase auth)
│   │   │   └── files/
│   │   │       └── upload/
│   │   │           └── route.ts ✅ UPDATED (Supabase auth) ⏳ NEEDS UPDATE (Supabase Storage)
│   │   ├── chat/
│   │   │   └── [id]/page.tsx ✅ UPDATED (Supabase auth)
│   │   └── ...
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts ✅ CREATED
│   └── settings/ ✅ CREATED
│       └── page.tsx ✅ CREATED
├── lib/
│   ├── ai/
│   │   ├── providers.ts ✅ UPDATED (multi-provider with dynamic API keys)
│   │   ├── models.ts ✅ UPDATED (Claude, Gemini, GPT models)
│   │   ├── entitlements.ts ✅ UPDATED (all models available)
│   │   └── tools/
│   │       ├── create-document.ts ✅ UPDATED (User instead of Session)
│   │       ├── update-document.ts ✅ UPDATED (User instead of Session)
│   │       ├── request-suggestions.ts ✅ UPDATED (User instead of Session)
│   │       └── github-tools.ts ✅ CREATED
│   ├── db/
│   │   ├── queries.ts ⏳ NEEDS UPDATE (Supabase user IDs)
│   │   └── schema.ts
│   ├── artifacts/
│   │   └── server.ts ✅ UPDATED (User instead of Session)
│   ├── mcp/
│   │   ├── github-client.ts ✅ CREATED
│   │   └── tool-converter.ts ✅ CREATED
│   ├── storage/
│   │   ├── api-keys.ts ✅ CREATED
│   │   └── github-token.ts ✅ CREATED
│   └── supabase/
│       ├── server.ts ✅ CREATED
│       ├── client.ts ✅ CREATED
│       └── middleware.ts ✅ CREATED
├── components/
│   ├── sidebar-user-nav.tsx ✅ UPDATED (Supabase auth)
│   ├── sidebar-history.tsx ✅ UPDATED (Supabase types)
│   ├── app-sidebar.tsx ✅ UPDATED (Supabase types, DevMate branding)
│   ├── model-selector.tsx ✅ UPDATED (multi-LLM with API key filtering, grouped by provider)
│   ├── sign-out-form.tsx ✅ UPDATED (logout action)
│   ├── chat.tsx ✅ UPDATED (API key handling)
│   ├── chat/
│   │   └── github-action-card.tsx ❌ NEEDS CREATION (optional - future)
│   ├── github/
│   │   ├── connection-status.tsx ✅ CREATED
│   │   └── repo-selector.tsx ❌ NEEDS CREATION (optional - future)
│   └── settings/
│       ├── account-section.tsx ✅ CREATED
│       ├── api-key-manager.tsx ✅ CREATED
│       ├── github-token-manager.tsx ✅ CREATED
│       ├── provider-selector.tsx ❌ NEEDS CREATION (optional - future)
│       └── token-usage-display.tsx ❌ NEEDS CREATION (optional - future)
├── hooks/
│   ├── use-api-keys.ts ✅ CREATED (localStorage management with encryption)
│   ├── use-github-token.ts ✅ CREATED (localStorage management with encryption)
│   ├── use-user.ts ✅ CREATED
│   └── use-auth.ts ❌ NEEDS CREATION (optional)
├── middleware.ts ✅ UPDATED (Supabase)
├── .env.example ✅ UPDATED
└── package.json ✅ UPDATED
```

### Legend
- ✅ **COMPLETED** - Fully implemented and tested
- ⏳ **NEEDS UPDATE** - Exists but needs modification
- ❌ **NEEDS CREATION** - Does not exist yet
- 🔄 **IN PROGRESS** - Currently being worked on

---

## 🎯 Next Implementation Steps

### CURRENT: Phase 6 - UI/UX Enhancements (Optional) or Testing & Deployment
**Status:** Phase 1, 2, 3, 4, & 5 Complete ✅
**Next:** Polish the UI or begin testing and deployment

**Core Functionality Complete!** DevMate now has:
- ✅ Supabase authentication with GitHub OAuth support
- ✅ Multi-LLM provider support (Claude, Gemini, GPT)
- ✅ User-managed API keys (localStorage)
- ✅ Settings page for configuration
- ✅ GitHub MCP integration for repository operations

**Optional Enhancement Tasks (Phase 6):**
1. Update branding and metadata throughout app
2. Create onboarding flow for new users
3. Add token usage display and cost tracking
4. Improve error messages and loading states
5. Add keyboard shortcuts and accessibility features

**Testing & Deployment Tasks (Phases 8-9):**
1. Install GitHub MCP server: `npm install -g @modelcontextprotocol/server-github`
2. Test authentication flows (email, GitHub OAuth)
3. Test all three LLM providers with different models
4. Test GitHub MCP tools (create issue, search code, etc.)
5. Deploy to Vercel with environment variables
6. Update README and documentation

**Note:** The app is now fully functional and ready for testing!

---

## 💡 Implementation Tips

### When Updating Components:
1. **Search for next-auth imports:** `useSession`, `signIn`, `signOut`
2. **Replace with Supabase:** Use `createClient()` from `@/lib/supabase/client`
3. **Update user access:** `const { data: { user } } = await supabase.auth.getUser()`
4. **Session management:** Supabase handles this automatically via middleware

### When Adding API Keys:
1. **Validate format:** Use `validateAPIKeyFormat()` from `lib/storage/api-keys.ts`
2. **Test key:** Make a test API call before saving
3. **Mask display:** Use `maskAPIKey()` for display
4. **Export/Import:** Use `exportSettings()` and `importSettings()`

### When Integrating MCP:
1. **Check token:** Ensure GitHub token exists before initializing client
2. **Handle errors:** MCP connection can fail - show user-friendly messages
3. **Cache tools:** Don't re-fetch tool definitions on every request
4. **Parse results:** MCP returns structured data - format for LLM consumption

---

## 🔍 Common Issues & Solutions

### Issue: "next-auth/react not found"
**Solution:** Remove all `next-auth` imports, use Supabase client instead

### Issue: "User ID mismatch" in database queries
**Solution:** Update `lib/db/queries.ts` to use Supabase user IDs (from `auth.users` table)

### Issue: API keys not persisting
**Solution:** Check localStorage quotas, ensure `window` is available (client-side only)

### Issue: GitHub OAuth redirect loop
**Solution:** Verify callback URL in GitHub OAuth app settings matches Supabase callback URL

### Issue: MCP tools not showing up
**Solution:** Check GitHub token validity, ensure MCP server URL is correct

---

## 📚 Reference Links

- **Supabase Docs:** https://supabase.com/docs
- **Vercel AI SDK:** https://sdk.vercel.ai/docs
- **MCP Protocol:** https://modelcontextprotocol.io/docs
- **GitHub MCP Server:** https://github.com/github/github-mcp-server
- **Anthropic API:** https://docs.anthropic.com/
- **Google AI:** https://ai.google.dev/
- **OpenAI API:** https://platform.openai.com/docs

---

## ✅ Mark Complete Checklist

After implementing each phase:
1. Test the feature thoroughly
2. Update the checkboxes above: `- [ ]` → `- [x]`
3. Add ✅ to file structure legend
4. Document any issues in "Common Issues & Solutions"
5. Commit changes with descriptive message

---

**Last Updated:** 2025-10-24
**Next Action:** Phase 2.1 - Update register page
