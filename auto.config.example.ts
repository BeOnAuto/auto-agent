// Example auto.config.ts file for Auto Engineer CLI plugin system
// Copy this file to your project root and rename to auto.config.ts

export default {
  // List of Auto Engineer packages to load as plugins
  plugins: [
    '@auto-engineer/narrative',
    '@auto-engineer/server-generator-apollo-emmett',
    '@auto-engineer/server-implementer',
    '@auto-engineer/information-architect',
    '@auto-engineer/server-checks',
    '@auto-engineer/generate-react-client',
    '@auto-engineer/react-component-implementer',
    '@auto-engineer/app-implementer',
  ],

  // Optional: Override command aliases when there are conflicts between packages
  // The format is: 'command-alias': '@package-name-that-should-handle-it'
  // Each package can expose multiple commands, so we resolve conflicts per command
  aliases: {
    // Example: If multiple packages register 'check:types':
    // 'check:types': '@auto-engineer/server-checks',
    // Example: If both generate-react-client and another package register 'generate:react-client':
    // 'generate:react-client': '@auto-engineer/generate-react-client',
  },
};
