import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from '@/components/ui/Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Spinner',
  component: Spinner,
};
export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    className: 'size-3',
  },
};

export const Large: Story = {
  args: {
    className: 'size-8',
  },
};
