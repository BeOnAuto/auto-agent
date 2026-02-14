import type { Meta, StoryObj } from '@storybook/react-vite';
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from '@/components/ui/Item';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Item> = {
  title: 'Item',
  component: Item,
};
export default meta;
type Story = StoryObj<typeof Item>;

export const Default: Story = {
  render: () => (
    <Item>
      <ItemContent>
        <ItemTitle>Item Title</ItemTitle>
        <ItemDescription>This is a description of the item with some details.</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline" size="sm">
          Edit
        </Button>
        <Button variant="ghost" size="sm">
          Delete
        </Button>
      </ItemActions>
    </Item>
  ),
};

export const OutlineVariant: Story = {
  render: () => (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>Outline Item</ItemTitle>
        <ItemDescription>An item displayed with the outline variant and a visible border.</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline" size="sm">
          View
        </Button>
      </ItemActions>
    </Item>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <Item size="sm">
      <ItemContent>
        <ItemTitle>Small Item</ItemTitle>
        <ItemDescription>Compact item with reduced padding.</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="ghost" size="sm">
          Action
        </Button>
      </ItemActions>
    </Item>
  ),
};
