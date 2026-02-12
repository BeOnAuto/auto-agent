import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@/components/ui/Badge';

const meta: Meta<typeof Badge> = {
  title: 'Badge',
  component: Badge,
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  render: () => <Badge>Default</Badge>,
};

export const Secondary: Story = {
  render: () => <Badge variant="secondary">Secondary</Badge>,
};

export const Destructive: Story = {
  render: () => <Badge variant="destructive">Destructive</Badge>,
};

export const Outline: Story = {
  render: () => <Badge variant="outline">Outline</Badge>,
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};
