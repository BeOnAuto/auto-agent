const { createProgram } = require('./auto-agent.cjs');
const program = createProgram();
program.parse(['node', 'auto-agent', 'mcp']);
