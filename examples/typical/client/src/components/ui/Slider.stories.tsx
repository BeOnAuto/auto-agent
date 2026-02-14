import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from '@/components/ui/Slider';

const meta: Meta<typeof Slider> = {
  title: 'Slider',
  component: Slider,
};
export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: () => <Slider defaultValue={[50]} max={100} step={1} className="w-[60%]" />,
};

export const Range: Story = {
  render: () => <Slider defaultValue={[25, 75]} max={100} step={1} className="w-[60%]" />,
};

export const WithSteps: Story = {
  render: () => <Slider defaultValue={[20]} max={100} step={10} className="w-[60%]" />,
};
