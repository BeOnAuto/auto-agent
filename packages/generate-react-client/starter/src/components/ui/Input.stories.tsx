import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

const meta: Meta<typeof Input> = {
  title: 'Input',
  component: Input,
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {},
};

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Enter your email...',
    type: 'email',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
    defaultValue: 'Cannot edit this',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email-input">Email</Label>
      <Input type="email" id="email-input" placeholder="Email" />
    </div>
  ),
};
