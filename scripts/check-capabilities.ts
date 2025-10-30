import { getModelById } from '../lib/db/admin-queries';

async function checkCapabilities() {
  try {
    const model = await getModelById('gemini-2.5-pro');

    console.log('\n=== GEMINI 2.5 PRO CAPABILITIES ===\n');
    console.log('Code Execution Enabled:', model?.capabilities?.codeExecution?.enabled);
    console.log('Web Search Enabled:', model?.capabilities?.webSearch?.enabled);
    console.log('URL Context Enabled:', model?.capabilities?.urlContext?.enabled);
    console.log('\nAll Capabilities:');
    console.log(JSON.stringify(model?.capabilities, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCapabilities();
