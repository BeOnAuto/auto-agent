import type { Meta, StoryObj } from '@storybook/react-vite';
import { BoldIcon } from 'lucide-react';
import { Toggle } from '@/components/ui/Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Toggle',
  component: Toggle,
};
export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  args: {
    'aria-label': 'Toggle bold',
    children: <BoldIcon />,
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    'aria-label': 'Toggle bold',
    children: <BoldIcon />,
  },
};

export const WithText: Story = {
  args: {
    'aria-label': 'Toggle italic',
    children: 'Italic',
  },
};

export const Pressed: Story = {
  args: {
    defaultPressed: true,
    'aria-label': 'Toggle bold',
    children: <BoldIcon />,
  },
};
