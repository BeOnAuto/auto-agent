import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Sheet> = {
  title: 'Sheet',
  component: Sheet,
};
export default meta;
type Story = StoryObj<typeof Sheet>;

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>Make changes to your profile here. Click save when you are done.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm">Name</span>
            <input className="border-input col-span-3 h-9 rounded-md border px-3 text-sm" defaultValue="John Doe" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm">Username</span>
            <input className="border-input col-span-3 h-9 rounded-md border px-3 text-sm" defaultValue="@johndoe" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const LeftSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Left Sheet</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Browse through the application.</SheetDescription>
        </SheetHeader>
        <nav className="grid gap-2 px-4 py-4">
          <a href="#" className="text-sm hover:underline">
            Home
          </a>
          <a href="#" className="text-sm hover:underline">
            About
          </a>
          <a href="#" className="text-sm hover:underline">
            Settings
          </a>
          <a href="#" className="text-sm hover:underline">
            Help
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  ),
};
