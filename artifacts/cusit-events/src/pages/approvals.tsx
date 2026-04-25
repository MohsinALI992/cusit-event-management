import { useListEvents, useApproveEvent, getListEventsQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, Check, X, AlertCircle, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Approvals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [rejectingEventId, setRejectingEventId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: events, isLoading } = useListEvents({
    status: "pending"
  });

  const approveMutation = useApproveEvent();

  const handleApprove = (id: number) => {
    approveMutation.mutate(
      { id, data: { decision: "approve" } },
      {
        onSuccess: () => {
          toast({ title: "Event Approved", description: "The event is now live and open for registration." });
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to approve event.", variant: "destructive" });
        }
      }
    );
  };

  const handleReject = () => {
    if (!rejectingEventId) return;
    
    approveMutation.mutate(
      { id: rejectingEventId, data: { decision: "reject", rejectionReason } },
      {
        onSuccess: () => {
          toast({ title: "Event Rejected", description: "The organizer will be notified." });
          setRejectingEventId(null);
          setRejectionReason("");
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to reject event.", variant: "destructive" });
        }
      }
    );
  };

  if (user?.role === "student") {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight">Pending Approvals</h2>
        <p className="text-muted-foreground">Review and approve proposed campus events.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-[200px] animate-pulse bg-muted" />
          ))}
        </div>
      ) : events && events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/4 bg-muted relative">
                  {event.bannerUrl ? (
                    <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover min-h-[160px]" />
                  ) : (
                    <div className="w-full h-full min-h-[160px] flex items-center justify-center bg-primary/10 text-primary">
                      <Calendar className="h-10 w-10 opacity-30" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 capitalize bg-background/80 text-foreground backdrop-blur border-none">
                    {event.category}
                  </Badge>
                </div>
                <div className="flex-1 p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-xl mb-1">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">Proposed by {event.organizerName}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm line-clamp-2 mb-4 flex-1">{event.description}</p>
                  
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> {format(new Date(event.startsAt), "MMM d, h:mm a")}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> {event.venue}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" /> Capacity: {event.capacity}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-auto">
                    <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={() => setRejectingEventId(event.id)}>
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button onClick={() => handleApprove(event.id)} disabled={approveMutation.isPending}>
                      <Check className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center border rounded-2xl bg-card/50 border-dashed">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <CheckSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-serif text-2xl font-semibold mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            There are no pending event proposals waiting for your approval right now.
          </p>
        </div>
      )}

      <Dialog open={!!rejectingEventId} onOpenChange={(open) => !open && setRejectingEventId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Event Proposal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this event proposal. This will be sent to the organizer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea 
                id="reason" 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Schedule conflict with midterms, please propose a different date."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingEventId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason || approveMutation.isPending}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
