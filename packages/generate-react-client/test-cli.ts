import { generateReactClientCommandHandler } from './src/index.js';

const targetDir = './test-output';

const result = await generateReactClientCommandHandler.handle({
  type: 'GenerateReactClient',
  data: { targetDir },
});

console.log(JSON.stringify(result, null, 2));
