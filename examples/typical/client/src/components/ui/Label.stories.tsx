import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from './Label';

const meta: Meta<typeof Label> = {
  title: 'Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'radio' },
      options: ['default', 'required'],
    },
    required: {
      control: { type: 'boolean' },
    },
    htmlFor: {
      control: { type: 'text' },
    },
    children: {
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Email address',
    htmlFor: 'email',
  },
};

export const Required: Story = {
  args: {
    children: 'Email address',
    htmlFor: 'email',
    required: true,
  },
};

export const RequiredVariant: Story = {
  args: {
    children: 'Email address',
    htmlFor: 'email',
    variant: 'required',
  },
};

export const WithForm: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="example-input" required>
        Example Field
      </Label>
      <input
        id="example-input"
        type="text"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Enter value..."
      />
    </div>
  ),
};

export const DisabledField: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="disabled-input" required>
        Disabled Field
      </Label>
      <input
        id="disabled-input"
        type="text"
        disabled
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Disabled input..."
      />
    </div>
  ),
};
