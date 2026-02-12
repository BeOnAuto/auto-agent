import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-docs'),
    {
      name: getAbsolutePath('@storybook/addon-mcp'),
      options: {
        toolsets: {
          dev: true,
          docs: true,
        },
      },
    },
  ],
  staticDirs: ['../public'],
  features: {
    experimentalComponentsManifest: true,
  },
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
