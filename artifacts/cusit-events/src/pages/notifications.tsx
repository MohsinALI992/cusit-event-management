import { useListMyNotifications, useMarkNotificationRead, getListMyNotificationsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, Calendar, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListMyNotifications({
    query: { queryKey: getListMyNotificationsQueryKey(), enabled: !!user }
  });
  
  const markReadMutation = useMarkNotificationRead();

  const handleMarkAsRead = (id: number) => {
    markReadMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyNotificationsQueryKey() });
        }
      }
    );
  };

  const handleMarkAllAsRead = () => {
    if (!notifications) return;
    const unread = notifications.filter(n => !n.isRead);
    unread.forEach(n => handleMarkAsRead(n.id));
  };

  if (!user) return null;

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Stay updated on your events and approvals.</p>
        </div>
        
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead} disabled={markReadMutation.isPending}>
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="h-[100px] animate-pulse bg-muted" />
          ))}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((note) => (
            <Card key={note.id} className={`overflow-hidden transition-all ${note.isRead ? 'opacity-70 hover:opacity-100' : 'border-primary/50 shadow-sm'}`}>
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className={`w-1 shrink-0 ${note.isRead ? 'bg-transparent' : 'bg-primary'}`} />
                  <div className="p-4 sm:p-6 flex-1 flex flex-col sm:flex-row gap-4 items-start">
                    <div className={`mt-1 h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${note.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                      {note.title.toLowerCase().includes('approved') || note.title.toLowerCase().includes('certificate') ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : note.title.toLowerCase().includes('rejected') ? (
                        <ShieldAlert className="h-5 w-5" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className={`font-semibold ${note.isRead ? '' : 'text-foreground'}`}>{note.title}</h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(note.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{note.body}</p>
                    </div>
                    
                    {!note.isRead && (
                      <Button variant="ghost" size="sm" className="mt-2 sm:mt-0 shrink-0" onClick={() => handleMarkAsRead(note.id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center border rounded-2xl bg-card/50 border-dashed">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-serif text-2xl font-semibold mb-2">No Notifications</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            You're all caught up! We'll notify you when there's an update on your events or registrations.
          </p>
        </div>
      )}
    </div>
  );
}
