# Quick Start Guide - Dynamic Model Configuration

## ✅ What's Been Completed

Your codebase has been successfully migrated to a **dynamic, database-driven model configuration system**. Here's what works now:

### Core Features
- ✅ **21 AI models** ready to seed (7 Anthropic, 6 Google, 8 OpenAI)
- ✅ **Per-model capabilities** (Thinking, File Inputs, Code Execution, Web Search, Image Generation, URL Context)
- ✅ **Provider-specific settings** (OpenAI reasoning effort, Google safety settings)
- ✅ **Admin panel** with full CRUD operations for models
- ✅ **Dynamic pricing** management
- ✅ **Chat API** loads model config from database with intelligent fallback
- ✅ **Production build** successful

## 🚀 Getting Started

### Step 1: Start the Development Server
```bash
cd /c/Users/anant/Desktop/codechat/github-chatbot
npm run dev
```
The server should be running at `http://localhost:3000`

### Step 2: Seed the Database
You have two options:

**Option A: Via API Endpoint (Requires Admin Auth)**
```bash
# Make sure you're logged in as admin first
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Cookie: YOUR_AUTH_COOKIE"
```

**Option B: Direct Script Execution**
```bash
npx tsx lib/db/seed-admin.ts
```

This will populate:
- 21 models with intelligent capability defaults
- 6 agent configurations
- 5 tool configurations

### Step 3: Access the Admin Panel
1. Navigate to `http://localhost:3000/admin`
2. Make sure you're logged in with an admin account
3. You should see three tabs: **Models**, **Agents**, **Tools**

### Step 4: Configure Models
In the **Models** tab, you can:
- Enable/disable models
- Click "Edit" on any model to configure:
  - Pricing (input/output cost per million tokens)
  - Capabilities (toggle Thinking, Code Execution, Web Search, etc.)
  - Thinking budget tokens
  - Provider-specific settings (e.g., OpenAI reasoning effort)
- Click "Sync Pricing" to update all models from the pricing database

## 📊 Model Capabilities Overview

### New Anthropic Models
- **claude-sonnet-4-20250514** - Full capabilities including thinking (8192 tokens)
- **claude-3-7-sonnet-20250219** - Full capabilities including thinking

### New Google Models
- **gemini-2.5-pro** - Full capabilities including thinking (8192 tokens)
- **gemini-2.5-flash** - Full capabilities including thinking
- **gemini-2.5-flash-lite** - Full capabilities (FREE during preview)
- **gemini-2.0-flash** - Limited capabilities (no thinking)

### New OpenAI Models
- **gpt-4.1** - Full GPT capabilities
- **gpt-4.1-mini** - Full GPT capabilities
- **o3** - Reasoning only (thinking with 32000 tokens, no tools/vision)
- **o4-mini** - Reasoning only (thinking with 32000 tokens, no tools/vision)

## 🎯 How to Test

### Test 1: View Models in Admin Panel
```bash
# Navigate to http://localhost:3000/admin
# Click "Models" tab
# You should see all 21 models grouped by provider
# Each model shows capability badges
```

### Test 2: Edit a Model's Capabilities
```bash
# In admin panel Models tab
# Click "Edit" on any model (e.g., "Claude Sonnet 4")
# Toggle some capabilities on/off
# Change thinking budget tokens
# Click "Save Changes"
# Verify changes persist after page refresh
```

### Test 3: Start a Chat with Database-Driven Model
```bash
# Start a new chat at http://localhost:3000
# Select a model from the dropdown
# Send a message
# Check server logs - you should see:
#   "[Chat API] ✅ Model config loaded: ... source: database"
```

### Test 4: Pricing Sync
```bash
# In admin panel Models tab
# Click "Sync Pricing" button
# Should see success toast
# All models should have updated pricing from lib/admin/pricing-sync.ts
```

## 📁 Key Files to Know

### Configuration
- `lib/db/schema.ts` - Database schema with capabilities and providerConfig
- `lib/ai/models.ts` - Static model definitions (fallback)
- `lib/admin/pricing-sync.ts` - Pricing data for all models

### Admin Panel
- `components/admin/models-tab.tsx` - Models management UI
- `components/admin/agents-tab.tsx` - Agents management UI
- `components/admin/tools-tab.tsx` - Tools management UI
- `app/api/admin/models/route.ts` - Models API endpoint
- `app/api/admin/seed/route.ts` - Seed endpoint

### Dynamic Loading
- `lib/ai/model-loader.ts` - Database model loader with caching
- `app/(chat)/api/chat/route.ts` - Chat API (uses database models)

### Database
- `lib/db/admin-queries.ts` - Database query functions
- `lib/db/seed-admin.ts` - Seed script
- `lib/db/migrations/0010_noisy_power_pack.sql` - Migration file

## 🔧 Troubleshooting

### Database Not Seeded?
```bash
# Run seed script directly
npx tsx lib/db/seed-admin.ts

# Or via API (requires admin auth)
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

### Build Errors?
```bash
# Clean and rebuild
rm -rf .next
npm run build
```

### Models Not Showing in Admin Panel?
- Check database connection (POSTGRES_URL in .env.local)
- Verify migrations ran: `npm run db:migrate`
- Check server logs for errors

### Chat API Using Static Config Instead of Database?
- Verify models are seeded in database
- Check logs for "source: database" vs "source: static"
- Cache revalidates every 5 minutes - wait or restart server

## 🎉 What's Next?

### Immediate Actions
1. ✅ Build completed successfully
2. ⏳ **Seed the database** (choose Option A or B above)
3. ⏳ **Test admin panel** (view, edit, save model capabilities)
4. ⏳ **Test chat** (verify database models are used)

### Optional Future Enhancements
These were planned but not critical for the current release:
- Advanced Options Menu for per-message capability toggles
- Tool-capability automatic filtering
- Convert ModelSelector to use database models
- Prompts management tab

## 📈 Performance Notes

- **Caching**: All database queries cached for 5 minutes
- **Build Time**: ~30-40 seconds for full production build
- **DB Impact**: Minimal - 1 cached query per chat request
- **Admin Panel**: Real-time updates, no page refresh needed

## 🆘 Need Help?

Check these resources:
1. `MIGRATION_TO_DYNAMIC_MODELS.md` - Detailed technical documentation
2. Server logs - Look for `[Chat API]` prefixed logs
3. Admin panel Models tab - Shows current model configurations
4. Database - Query `ModelConfig` table directly if needed

---

**Status**: ✅ Ready for testing and deployment
**Next Step**: Seed the database and test the admin panel!
