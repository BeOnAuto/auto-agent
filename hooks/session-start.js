const fs = require('fs');
const path = require('path');

const configDir = path.join(process.cwd(), '.auto-agent');
const configPath = path.join(configDir, 'config.json');
const modelPath = path.join(configDir, 'model.json');

if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  let modelSummary = '';
  if (fs.existsSync(modelPath)) {
    try {
      const model = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
      const narrativeCount = (model.narratives || []).length;
      const sceneCount = (model.scenes || []).length;
      const momentCount = (model.scenes || []).reduce(
        (sum, s) => sum + (s.moments || []).length,
        0
      );
      const messageCount = (model.messages || []).length;
      modelSummary = ` Model loaded: ${narrativeCount} narrative(s), ${sceneCount} scene(s), ${momentCount} moment(s), ${messageCount} message(s).`;
    } catch (e) {
      modelSummary = ' Model file exists but could not be parsed.';
    }
  }

  let stackSummary = 'Default stack: React + GraphQL + Apollo with json-render.dev for UI rendering.';
  if (config.stack) {
    const s = config.stack;
    stackSummary = `Configured stack: ${s.frontend || 'react-vite'} frontend in ${s.clientDir || 'client'}/, ${s.backend || 'apollo-graphql'} backend in ${s.serverDir || 'server'}/.`;
  }

  const additionalContext = [
    `You are connected to Auto workspace "${config.workspaceId}".`,
    'The narrative model at .auto-agent/model.json is a specification medium that expresses application intent through narratives, scenes, and moments.',
    'The model is live-synced from the collaboration server via WebSocket.',
    modelSummary,
    '',
    'Available tools: auto_get_model (fetch model), auto_send_model (validate and correct model), auto_get_changes (get recent deltas), auto_update_endpoints (report dev server URLs).',
    stackSummary,
    'Use /auto-agent:scaffold to set up and start dev servers immediately.',
    'Use /auto-agent:build to generate application code from this model.',
  ]
    .filter(Boolean)
    .join(' ');

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: additionalContext,
      },
    })
  );
} else {
  process.stdout.write(JSON.stringify({ message: '' }));
}
