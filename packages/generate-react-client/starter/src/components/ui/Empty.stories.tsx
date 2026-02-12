import type { Meta, StoryObj } from '@storybook/react-vite';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/Empty';
import { InboxIcon } from 'lucide-react';

const meta: Meta<typeof Empty> = {
  title: 'Empty',
  component: Empty,
};
export default meta;
type Story = StoryObj<typeof Empty>;

export const Default: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No results found</EmptyTitle>
        <EmptyDescription>Try adjusting your search or filter to find what you are looking for.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>Your inbox is empty</EmptyTitle>
        <EmptyDescription>New messages will appear here when you receive them.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};
