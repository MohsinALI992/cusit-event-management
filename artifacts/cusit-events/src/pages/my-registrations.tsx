import { useListMyRegistrations, getListMyRegistrationsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, ArrowRight, Ticket, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function MyRegistrations() {
  const { user } = useAuth();
  const { data: registrations, isLoading } = useListMyRegistrations({
    query: { queryKey: getListMyRegistrationsQueryKey(), enabled: !!user && user.role === "student" }
  });

  if (user?.role !== "student") {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight">My Registrations</h2>
        <p className="text-muted-foreground">Manage your upcoming and past event registrations.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-[250px] animate-pulse bg-muted" />
          ))}
        </div>
      ) : registrations && registrations.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {registrations.map((reg) => {
            const isUpcoming = new Date(reg.event.startsAt) > new Date();
            const statusColor = 
              reg.attendanceStatus === "present" ? "text-green-600 bg-green-50 border-green-200" :
              reg.attendanceStatus === "absent" ? "text-red-600 bg-red-50 border-red-200" :
              reg.attendanceStatus === "late" ? "text-amber-600 bg-amber-50 border-amber-200" :
              "text-muted-foreground bg-muted border-transparent";
              
            return (
              <Card key={reg.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md">
                <div className="h-32 bg-muted relative">
                  {reg.event.bannerUrl ? (
                    <img src={reg.event.bannerUrl} alt={reg.event.title} className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                      <Calendar className="h-8 w-8 opacity-30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="capitalize bg-background/90 text-foreground backdrop-blur-sm border-none shadow-sm">
                      {reg.event.category}
                    </Badge>
                    {!isUpcoming && reg.attendanceStatus && (
                      <Badge variant="outline" className={`capitalize backdrop-blur-sm shadow-sm ${statusColor}`}>
                        {reg.attendanceStatus}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg line-clamp-1 flex-1 pr-4">{reg.event.title}</h3>
                    {isUpcoming && <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary">Upcoming</Badge>}
                  </div>
                  
                  <div className="space-y-2 mb-4 text-sm text-muted-foreground flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span className="truncate">{format(new Date(reg.event.startsAt), "EEE, MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span className="truncate">{format(new Date(reg.event.startsAt), "h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{reg.event.venue}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Registered: {format(new Date(reg.registeredAt), "MMM d")}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 -mr-2" asChild>
                      <Link href={`/events/${reg.event.id}`}>
                        Details <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center border rounded-2xl bg-card/50 border-dashed">
          <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <Ticket className="h-8 w-8" />
          </div>
          <h3 className="font-serif text-2xl font-semibold mb-2">No Registrations Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            You haven't registered for any events. Browse the events catalog to find something interesting.
          </p>
          <Button asChild>
            <Link href="/events">Browse Events</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
