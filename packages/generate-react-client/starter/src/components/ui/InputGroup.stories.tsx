import type { Meta, StoryObj } from '@storybook/react-vite';
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from '@/components/ui/InputGroup';
import { MailIcon, SearchIcon } from 'lucide-react';

const meta: Meta<typeof InputGroup> = {
  title: 'InputGroup',
  component: InputGroup,
};
export default meta;
type Story = StoryObj<typeof InputGroup>;

export const Default: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupAddon align="inline-start">
        <InputGroupText>
          <MailIcon />
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="you@example.com" />
    </InputGroup>
  ),
};

export const WithPrefixAndSuffix: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupAddon align="inline-start">
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="example.com" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>.com</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const SearchInput: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupAddon align="inline-start">
        <InputGroupText>
          <SearchIcon />
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="Search..." />
    </InputGroup>
  ),
};
