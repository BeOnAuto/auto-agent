import type { Meta, StoryObj } from '@storybook/react-vite';
import { DirectionProvider, useDirection } from '@/components/ui/Direction';

const meta: Meta<typeof DirectionProvider> = {
  title: 'Direction',
  component: DirectionProvider,
};
export default meta;
type Story = StoryObj<typeof DirectionProvider>;

function DirectionDisplay() {
  const direction = useDirection();
  return <p className="text-sm text-muted-foreground">Current direction: {direction ?? 'not set'}</p>;
}

export const LTR: Story = {
  render: () => (
    <DirectionProvider dir="ltr">
      <div className="space-y-2">
        <DirectionDisplay />
        <p>This content is rendered in a left-to-right context.</p>
      </div>
    </DirectionProvider>
  ),
};

export const RTL: Story = {
  render: () => (
    <DirectionProvider dir="rtl">
      <div className="space-y-2" dir="rtl">
        <DirectionDisplay />
        <p>This content is rendered in a right-to-left context.</p>
      </div>
    </DirectionProvider>
  ),
};
