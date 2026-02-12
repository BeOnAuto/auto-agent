import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from '@/components/ui/Progress';

const meta: Meta<typeof Progress> = {
  title: 'Progress',
  component: Progress,
};
export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 50,
  },
  render: (args) => <Progress {...args} className="w-[60%]" />,
};

export const Empty: Story = {
  render: () => <Progress value={0} className="w-[60%]" />,
};

export const Half: Story = {
  render: () => <Progress value={50} className="w-[60%]" />,
};

export const Full: Story = {
  render: () => <Progress value={100} className="w-[60%]" />,
};
