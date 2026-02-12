import type { Meta, StoryObj } from '@storybook/react-vite';
import { HomeIcon, SettingsIcon, UsersIcon, InboxIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/Sidebar';

const meta: Meta<typeof Sidebar> = {
  title: 'Sidebar',
  component: Sidebar,
};
export default meta;
type Story = StoryObj<typeof Sidebar>;

const menuItems = [
  { label: 'Home', icon: HomeIcon },
  { label: 'Inbox', icon: InboxIcon },
  { label: 'Users', icon: UsersIcon },
  { label: 'Settings', icon: SettingsIcon },
];

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <span className="px-2 text-lg font-semibold">My App</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <span className="px-2 text-xs text-muted-foreground">v1.0.0</span>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 p-4">
        <SidebarTrigger />
        <p className="mt-4 text-sm text-muted-foreground">Main content area</p>
      </main>
    </SidebarProvider>
  ),
};

export const WithActiveItem: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <span className="px-2 text-lg font-semibold">My App</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton isActive={index === 0}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 p-4">
        <SidebarTrigger />
        <p className="mt-4 text-sm text-muted-foreground">Main content area</p>
      </main>
    </SidebarProvider>
  ),
};
