import { Link, useLocation } from "wouter";
import { AiChat } from "@/components/ai-chat";
import { 
  useGetCurrentUser, 
  useLogout, 
  useListMyNotifications,
  getGetCurrentUserQueryKey,
  getListMyNotificationsQueryKey,
} from "@workspace/api-client-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { 
  Calendar, 
  LayoutDashboard, 
  CheckSquare, 
  Ticket, 
  Award, 
  Bell, 
  BarChart, 
  LogOut,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey(), retry: false } });
  const [location, setLocation] = useLocation();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const { data: notifications } = useListMyNotifications({
    query: {
      queryKey: getListMyNotificationsQueryKey(),
      enabled: !!user,
    }
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      }
    });
  };

  if (!user) return null;

  const role = user.role;

  const navigation = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["student", "faculty", "coordinator", "society_head", "admin"] },
    { title: "Browse Events", url: "/events", icon: Calendar, roles: ["student", "faculty", "coordinator", "society_head", "admin"] },
    { title: "Propose Event", url: "/events/new", icon: PlusCircle, roles: ["faculty", "coordinator", "society_head", "admin"] },
    { title: "Approvals", url: "/approvals", icon: CheckSquare, roles: ["faculty", "coordinator", "admin"] },
    { title: "My Registrations", url: "/my-registrations", icon: Ticket, roles: ["student"] },
    { title: "My Certificates", url: "/my-certificates", icon: Award, roles: ["student"] },
    { title: "Notifications", url: "/notifications", icon: Bell, roles: ["student", "faculty", "coordinator", "society_head", "admin"], badge: unreadCount > 0 ? unreadCount : undefined },
    { title: "Reports", url: "/reports", icon: BarChart, roles: ["admin", "faculty"] },
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(role));

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-2 font-serif text-xl font-bold text-sidebar-primary">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                CE
              </div>
              CUSIT Events
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredNav.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url || (item.url !== "/" && location.startsWith(item.url))}>
                        <Link href={item.url} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </div>
                          {item.badge !== undefined && (
                            <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-8 w-8 border border-sidebar-border">
                  <AvatarImage src={user.avatarUrl || ""} />
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{user.name}</span>
                  <span className="text-xs text-sidebar-foreground/70 capitalize">{user.role.replace("_", " ")}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
            <SidebarTrigger />
            <div className="flex-1" />
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </div>
      <AiChat />
    </SidebarProvider>
  );
}
