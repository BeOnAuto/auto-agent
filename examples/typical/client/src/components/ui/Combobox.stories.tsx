import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/Combobox';

const frameworks = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'SolidJS' },
];

function SearchableCombobox() {
  const [value, setValue] = React.useState<string | null>(null);

  return (
    <Combobox value={value} onValueChange={setValue}>
      <ComboboxInput placeholder="Search frameworks..." />
      <ComboboxContent>
        <ComboboxList>
          {frameworks.map((fw) => (
            <ComboboxItem key={fw.value} value={fw.value}>
              {fw.label}
            </ComboboxItem>
          ))}
          <ComboboxEmpty>No framework found.</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function ClearableCombobox() {
  const [value, setValue] = React.useState<string | null>(null);

  return (
    <Combobox value={value} onValueChange={setValue}>
      <ComboboxInput placeholder="Pick a framework..." showClear />
      <ComboboxContent>
        <ComboboxList>
          {frameworks.map((fw) => (
            <ComboboxItem key={fw.value} value={fw.value}>
              {fw.label}
            </ComboboxItem>
          ))}
          <ComboboxEmpty>No framework found.</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

const meta: Meta = {
  title: 'Combobox',
  component: ComboboxInput,
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <SearchableCombobox />,
};

export const WithClear: Story = {
  render: () => <ClearableCombobox />,
};
