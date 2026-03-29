const fs = require('fs');
const path = require('path');

const configPath = path.join(process.cwd(), '.auto-agent', 'config.json');

if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  process.stdout.write(
    JSON.stringify({
      message:
        'Auto Agent: Connected to workspace ' +
        config.workspaceId +
        '. Use auto_get_model to fetch the current model.',
    })
  );
} else {
  process.stdout.write(JSON.stringify({ message: '' }));
}
