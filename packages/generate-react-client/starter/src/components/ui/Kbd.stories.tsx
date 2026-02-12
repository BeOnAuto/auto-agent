import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from './Kbd';

const meta: Meta<typeof Kbd> = {
  title: 'Kbd',
  component: Kbd,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '⌘K',
  },
};

export const WithText: Story = {
  args: {
    children: 'Ctrl',
  },
};

export const ArrowKeys: Story = {
  args: {
    children: '→',
  },
};

export const Multiple: Story = {
  render: () => (
    <div className="flex gap-2 items-center">
      <Kbd>⌘</Kbd>
      <span>+</span>
      <Kbd>K</Kbd>
    </div>
  ),
};

export const Combination: Story = {
  render: () => (
    <div className="flex gap-2 items-center">
      <Kbd>Ctrl</Kbd>
      <span>+</span>
      <Kbd>Shift</Kbd>
      <span>+</span>
      <Kbd>P</Kbd>
    </div>
  ),
};
