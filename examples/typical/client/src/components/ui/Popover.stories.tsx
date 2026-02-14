import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Popover> = {
  title: 'Popover',
  component: Popover,
};
export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-muted-foreground text-sm">Set the dimensions for the layer.</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm">Width</span>
              <input className="border-input col-span-2 h-8 rounded-md border px-3 text-sm" defaultValue="100%" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm">Height</span>
              <input className="border-input col-span-2 h-8 rounded-md border px-3 text-sm" defaultValue="25px" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const SimpleText: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Info</Button>
      </PopoverTrigger>
      <PopoverContent className="w-60">
        <p className="text-sm">This is a simple popover with some informational text content.</p>
      </PopoverContent>
    </Popover>
  ),
};
