import { commandHandler } from './src/commands/implement-react-component.js';
import type { Job } from './src/types.js';

const job: Job = {
  id: 'job_atom_button',
  dependsOn: [],
  target: 'ImplementReactComponent',
  payload: {
    title: 'Implement Button Atom',
    description: 'A clickable button component with multiple variants',
    type: 'atom',
    componentId: 'atom_button',
    implementation: 'Create a button component with default, destructive, outline, secondary, ghost, and link variants',
    acceptanceCriteria: [
      'Supports multiple visual variants',
      'Handles disabled and loading states',
      'Uses proper button semantics',
    ],
    prompt: 'Create a Button atom component with multiple variants and proper interaction states.',
    storybookPath: 'atoms/Button',
    files: {
      create: ['components/atoms/Button/Button.tsx', 'components/atoms/Button/Button.stories.tsx'],
      modify: [],
    },
  },
};

const targetDir = process.argv[2] || './test-client';

async function main() {
  console.log(`Running ImplementReactComponent for "${job.payload.componentId}" in ${targetDir}`);

  const result = await commandHandler.handle({
    type: 'ImplementReactComponent',
    data: { targetDir, job },
    timestamp: new Date(),
    requestId: 'test-cli',
  });

  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('Test CLI failed:', err);
  process.exit(1);
});
