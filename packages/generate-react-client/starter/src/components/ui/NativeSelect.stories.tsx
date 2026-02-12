import type { Meta, StoryObj } from '@storybook/react-vite';
import { NativeSelect, NativeSelectOption } from '@/components/ui/NativeSelect';

const meta: Meta<typeof NativeSelect> = {
  title: 'NativeSelect',
  component: NativeSelect,
};
export default meta;
type Story = StoryObj<typeof NativeSelect>;

export const Default: Story = {
  render: () => (
    <NativeSelect defaultValue="react">
      <NativeSelectOption value="react">React</NativeSelectOption>
      <NativeSelectOption value="vue">Vue</NativeSelectOption>
      <NativeSelectOption value="angular">Angular</NativeSelectOption>
      <NativeSelectOption value="svelte">Svelte</NativeSelectOption>
    </NativeSelect>
  ),
};

export const Small: Story = {
  render: () => (
    <NativeSelect size="sm" defaultValue="">
      <NativeSelectOption value="" disabled>
        Select a fruit...
      </NativeSelectOption>
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
      <NativeSelectOption value="banana">Banana</NativeSelectOption>
      <NativeSelectOption value="cherry">Cherry</NativeSelectOption>
    </NativeSelect>
  ),
};

export const Disabled: Story = {
  render: () => (
    <NativeSelect disabled defaultValue="react">
      <NativeSelectOption value="react">React</NativeSelectOption>
      <NativeSelectOption value="vue">Vue</NativeSelectOption>
    </NativeSelect>
  ),
};
