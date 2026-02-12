import { commandHandler } from './src/commands/implement-react-component.js';
import type { ComponentTask } from './src/types.js';

const task: ComponentTask = {
  name: 'Button',
  description: 'A clickable button component with multiple variants',
  level: 'atom',
  props: {
    label: 'string',
    onClick: '() => void',
    variant: "'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'",
    size: "'default' | 'sm' | 'lg' | 'icon'",
    disabled: 'boolean',
  },
  variants: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
  state: ['disabled', 'loading'],
};

const clientDir = process.argv[2] || './test-client';

async function main() {
  console.log(`Running ImplementReactComponent for "${task.name}" in ${clientDir}`);

  const result = await commandHandler.handle({
    type: 'ImplementReactComponent',
    data: { task, clientDir },
    timestamp: new Date(),
    requestId: 'test-cli',
  });

  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('Test CLI failed:', err);
  process.exit(1);
});
