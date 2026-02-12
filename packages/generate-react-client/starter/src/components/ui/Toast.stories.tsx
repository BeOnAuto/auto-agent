import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/components/ui/Button';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/Toast';
import { Toaster } from '@/components/ui/Toaster';
import { useToast } from '@/hooks/use-toast';

const meta: Meta<typeof Toast> = {
  title: 'Toast',
  component: Toast,
};
export default meta;
type Story = StoryObj<typeof Toast>;

function ToastDemo() {
  const { toast } = useToast();

  return (
    <div>
      <Toaster />
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Scheduled: Catch up',
            description: 'Friday, February 10, 2026 at 5:57 PM',
          });
        }}
      >
        Show Toast
      </Button>
    </div>
  );
}

export const Default: Story = {
  render: () => <ToastDemo />,
};

function ToastDestructiveDemo() {
  const { toast } = useToast();

  return (
    <div>
      <Toaster />
      <Button
        variant="outline"
        onClick={() => {
          toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
          });
        }}
      >
        Show Destructive Toast
      </Button>
    </div>
  );
}

export const Destructive: Story = {
  render: () => <ToastDestructiveDemo />,
};

function ToastWithActionDemo() {
  const { toast } = useToast();

  return (
    <div>
      <Toaster />
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Event created',
            description: 'Sunday, December 03, 2023 at 9:00 AM',
            action: <ToastAction altText="Undo">Undo</ToastAction>,
          });
        }}
      >
        Show Toast with Action
      </Button>
    </div>
  );
}

export const WithAction: Story = {
  render: () => <ToastWithActionDemo />,
};

export const Inline: Story = {
  render: () => (
    <ToastProvider>
      <Toast open>
        <div className="grid gap-1">
          <ToastTitle>Toast Title</ToastTitle>
          <ToastDescription>This is a toast description.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
};
