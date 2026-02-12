import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from '@/components/ui/Separator';

const meta: Meta<typeof Separator> = {
  title: 'Separator',
  component: Separator,
};
export default meta;
type Story = StoryObj<typeof Separator>;

export const Default: Story = {
  render: () => (
    <div>
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
        <p className="text-muted-foreground text-sm">An open-source UI component library.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-12 items-center space-x-4 text-sm">
      <div>First</div>
      <Separator orientation="vertical" />
      <div>Second</div>
      <Separator orientation="vertical" />
      <div>Third</div>
    </div>
  ),
};
