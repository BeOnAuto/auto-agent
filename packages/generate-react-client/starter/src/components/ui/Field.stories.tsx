import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field, FieldLabel, FieldDescription, FieldError, FieldContent } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';

const meta: Meta<typeof Field> = {
  title: 'Field',
  component: Field,
};
export default meta;
type Story = StoryObj<typeof Field>;

export const Default: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <FieldContent>
        <Input id="email" type="email" placeholder="you@example.com" />
        <FieldDescription>We will never share your email.</FieldDescription>
      </FieldContent>
    </Field>
  ),
};

export const WithError: Story = {
  render: () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="email-err">Email</FieldLabel>
      <FieldContent>
        <Input id="email-err" type="email" defaultValue="invalid-email" aria-invalid="true" />
        <FieldDescription>Enter a valid email address.</FieldDescription>
        <FieldError>Please enter a valid email address.</FieldError>
      </FieldContent>
    </Field>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal">
      <FieldLabel htmlFor="name-h">Full Name</FieldLabel>
      <FieldContent>
        <Input id="name-h" placeholder="John Doe" />
        <FieldDescription>Your first and last name.</FieldDescription>
      </FieldContent>
    </Field>
  ),
};
