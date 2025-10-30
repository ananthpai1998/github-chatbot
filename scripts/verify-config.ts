import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { getAllTools, getAgentById, getModelById } from '../lib/db/admin-queries';

async function verify() {
  console.log('\n=== AGENT CONFIG ===');
  const agent = await getAgentById('chatModel');
  console.log('Agent:', agent?.name);
  console.log('System Prompt Length:', agent?.systemPrompt?.length);
  console.log('Enabled Tools:', agent?.enabledTools);
  console.log('Includes artifacts prompt:', agent?.systemPrompt?.includes('createDocument'));

  console.log('\n=== MODEL CONFIG ===');
  const model = await getModelById('gemini-2.5-pro');
  console.log('Model:', model?.name);
  console.log('Has toolPrompts.base:', !!model?.toolPrompts?.base);
  console.log('Base prompt length:', model?.toolPrompts?.base?.length || 0);

  console.log('\n=== TOOL CONFIGS ===');
  const tools = await getAllTools();
  for (const tool of tools) {
    console.log(`${tool.id}:`);
    console.log(`  Enabled: ${tool.isEnabled}`);
    console.log(`  Has prompts: ${!!tool.toolPrompts}`);
    if (tool.toolPrompts) {
      console.log(`    - description: ${!!tool.toolPrompts.description} (${tool.toolPrompts.description?.length || 0} chars)`);
      console.log(`    - usageGuidelines: ${!!tool.toolPrompts.usageGuidelines} (${tool.toolPrompts.usageGuidelines?.length || 0} chars)`);
      console.log(`    - examples: ${!!tool.toolPrompts.examples} (${tool.toolPrompts.examples?.length || 0} chars)`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`✓ Agent has system prompt: ${!!agent?.systemPrompt}`);
  console.log(`✓ Model has base tool prompt: ${!!model?.toolPrompts?.base}`);
  console.log(`✓ Tools with prompts: ${tools.filter(t => t.toolPrompts).length}/${tools.length}`);

  process.exit(0);
}

verify().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
