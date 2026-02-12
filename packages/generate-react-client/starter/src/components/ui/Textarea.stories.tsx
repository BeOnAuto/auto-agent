import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from '@/components/ui/Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Textarea',
  component: Textarea,
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Type your message here...',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'This textarea is disabled',
    disabled: true,
  },
};
