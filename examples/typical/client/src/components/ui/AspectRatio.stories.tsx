import type { Meta, StoryObj } from '@storybook/react-vite';
import { AspectRatio } from '@/components/ui/AspectRatio';

const meta: Meta<typeof AspectRatio> = {
  title: 'AspectRatio',
  component: AspectRatio,
};
export default meta;
type Story = StoryObj<typeof AspectRatio>;

export const Default: Story = {
  render: () => (
    <div className="w-[450px]">
      <AspectRatio ratio={16 / 9}>
        <div className="flex h-full w-full items-center justify-center rounded-md bg-slate-200 dark:bg-slate-800">
          <span className="text-sm text-slate-500">16:9 Aspect Ratio</span>
        </div>
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div className="w-[300px]">
      <AspectRatio ratio={1}>
        <div className="flex h-full w-full items-center justify-center rounded-md bg-slate-200 dark:bg-slate-800">
          <span className="text-sm text-slate-500">1:1 Square</span>
        </div>
      </AspectRatio>
    </div>
  ),
};
