import { 
  useGetEvent, 
  useListEventRegistrations, 
  useListEventAttendance,
  useListEventFeedback,
  useRegisterForEvent,
  useUnregisterFromEvent,
  useMarkAttendance,
  useIssueCertificates,
  getGetEventQueryKey,
  getListEventRegistrationsQueryKey,
  getListEventAttendanceQueryKey,
  getListEventFeedbackQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Calendar, MapPin, Clock, Users, ArrowLeft, Ticket, 
  UserCheck, AlertTriangle, ShieldCheck, Download, Star, CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id || "0");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: event, isLoading } = useGetEvent(eventId, { 
    query: { queryKey: getGetEventQueryKey(eventId), enabled: !!eventId } 
  });

  const isOrganizerOrAdmin = user && (user.role === "admin" || (event && event.organizerId === user.id));
  const canMarkAttendance = user && ["admin", "faculty", "coordinator"].includes(user.role);
  
  const { data: registrations } = useListEventRegistrations(eventId, { query: { queryKey: getListEventRegistrationsQueryKey(eventId), enabled: !!isOrganizerOrAdmin } });
  const { data: attendance } = useListEventAttendance(eventId, { query: { queryKey: getListEventAttendanceQueryKey(eventId), enabled: !!canMarkAttendance } });
  const { data: feedback } = useListEventFeedback(eventId, { query: { queryKey: getListEventFeedbackQueryKey(eventId), enabled: !!isOrganizerOrAdmin && event?.status === "completed" } });

  const registerMutation = useRegisterForEvent();
  const unregisterMutation = useUnregisterFromEvent();
  const markAttendanceMutation = useMarkAttendance();
  const issueCertsMutation = useIssueCertificates();

  const [attendanceEdits, setAttendanceEdits] = useState<Record<number, "present" | "absent" | "late">>({});

  if (isLoading || !event) {
    return <div className="h-[400px] flex items-center justify-center">Loading event details...</div>;
  }

  const handleRegister = () => {
    registerMutation.mutate(
      { id: eventId },
      {
        onSuccess: () => {
          toast({ title: "Registered Successfully", description: "You are now registered for this event." });
          queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(eventId) });
        },
        onError: () => toast({ title: "Registration Failed", variant: "destructive" })
      }
    );
  };

  const handleUnregister = () => {
    unregisterMutation.mutate(
      { id: eventId },
      {
        onSuccess: () => {
          toast({ title: "Unregistered", description: "You are no longer registered for this event." });
          queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(eventId) });
        },
        onError: () => toast({ title: "Failed to unregister", variant: "destructive" })
      }
    );
  };

  const handleSaveAttendance = () => {
    const entries = Object.entries(attendanceEdits).map(([regId, status]) => ({
      registrationId: parseInt(regId),
      status
    }));

    if (entries.length === 0) return;

    markAttendanceMutation.mutate(
      { id: eventId, data: { entries } },
      {
        onSuccess: () => {
          toast({ title: "Attendance Saved", description: "Attendance records have been updated." });
          setAttendanceEdits({});
          queryClient.invalidateQueries({ queryKey: getListEventAttendanceQueryKey(eventId) });
        }
      }
    );
  };

  const handleIssueCertificates = () => {
    issueCertsMutation.mutate(
      { id: eventId },
      {
        onSuccess: (data) => {
          toast({ title: "Certificates Issued", description: `Successfully issued ${data.issuedCount} certificates.` });
        }
      }
    );
  };

  const isFull = event.registrationCount >= event.capacity;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <Button variant="ghost" asChild className="-ml-4 text-muted-foreground">
        <Link href="/events"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Events</Link>
      </Button>

      <div className="rounded-2xl overflow-hidden border bg-card shadow-sm">
        <div className="h-64 sm:h-80 md:h-96 relative bg-muted">
          {event.bannerUrl ? (
            <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
              <Calendar className="h-24 w-24 opacity-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-3xl">
              <Badge className="mb-3 capitalize bg-primary text-primary-foreground border-none">
                {event.category}
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight mb-2">
                {event.title}
              </h1>
              <p className="text-muted-foreground font-medium text-lg">
                Organized by {event.organizerName}
              </p>
            </div>
            
            {user?.role === "student" && event.status === "approved" && (
              <div className="shrink-0 flex gap-3">
                {event.isRegistered ? (
                  <Button variant="outline" size="lg" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={handleUnregister} disabled={unregisterMutation.isPending}>
                    Cancel Registration
                  </Button>
                ) : (
                  <Button size="lg" onClick={handleRegister} disabled={registerMutation.isPending || isFull} className="font-bold">
                    <Ticket className="mr-2 h-5 w-5" />
                    {isFull ? "Event Full" : "Register Now"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 p-6 md:p-8">
          <div className="md:col-span-2 space-y-8">
            <div>
              <h3 className="text-2xl font-serif font-bold mb-4">About this Event</h3>
              <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card className="border-none shadow-md bg-secondary/10">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-background rounded-lg p-3 shrink-0 shadow-sm text-primary">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Date</p>
                    <p className="text-muted-foreground">{format(new Date(event.startsAt), "EEEE, MMMM d, yyyy")}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-background rounded-lg p-3 shrink-0 shadow-sm text-primary">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Time</p>
                    <p className="text-muted-foreground">
                      {format(new Date(event.startsAt), "h:mm a")} - {format(new Date(event.endsAt), "h:mm a")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-background rounded-lg p-3 shrink-0 shadow-sm text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Venue</p>
                    <p className="text-muted-foreground">{event.venue}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium flex items-center gap-2"><Users className="h-4 w-4" /> Capacity</span>
                    <span className="text-sm text-muted-foreground">{event.registrationCount} / {event.capacity}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isFull ? 'bg-destructive' : 'bg-primary'}`}
                      style={{ width: `${Math.min(100, (event.registrationCount / event.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {(isOrganizerOrAdmin || canMarkAttendance) && (
        <div className="mt-12">
          <Tabs defaultValue="registrations">
            <TabsList className="mb-6 bg-transparent border-b rounded-none w-full justify-start h-auto p-0 space-x-6">
              <TabsTrigger value="registrations" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-3">
                Registrations
              </TabsTrigger>
              {canMarkAttendance && (
                <TabsTrigger value="attendance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-3">
                  Attendance
                </TabsTrigger>
              )}
              {isOrganizerOrAdmin && event.status === "completed" && (
                <TabsTrigger value="feedback" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-3">
                  Feedback
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="registrations">
              <Card>
                <CardHeader>
                  <CardTitle>Registered Students</CardTitle>
                  <CardDescription>All users currently registered for this event.</CardDescription>
                </CardHeader>
                <CardContent>
                  {registrations && registrations.length > 0 ? (
                    <div className="rounded-md border">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                            <th className="px-4 py-3 font-medium">Department</th>
                            <th className="px-4 py-3 font-medium text-right">Registered On</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {registrations.map(reg => (
                            <tr key={reg.id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-foreground">{reg.userName}</td>
                              <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{reg.userEmail}</td>
                              <td className="px-4 py-3">{reg.userDepartment || "-"}</td>
                              <td className="px-4 py-3 text-right text-muted-foreground">{format(new Date(reg.registeredAt), "MMM d, yyyy")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No registrations yet.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {canMarkAttendance && (
              <TabsContent value="attendance">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Attendance Roster</CardTitle>
                      <CardDescription>Mark student attendance for this event.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {event.status === "completed" && (
                        <Button variant="outline" onClick={handleIssueCertificates} disabled={issueCertsMutation.isPending}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> Issue Certificates
                        </Button>
                      )}
                      {Object.keys(attendanceEdits).length > 0 && (
                        <Button onClick={handleSaveAttendance} disabled={markAttendanceMutation.isPending}>
                          <UserCheck className="mr-2 h-4 w-4" /> Save Changes
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {attendance && attendance.length > 0 ? (
                      <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted text-muted-foreground">
                            <tr>
                              <th className="px-4 py-3 font-medium">Name</th>
                              <th className="px-4 py-3 font-medium hidden sm:table-cell">Department</th>
                              <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {attendance.map(row => {
                              const currentStatus = attendanceEdits[row.registrationId] || row.status;
                              return (
                                <tr key={row.registrationId} className="hover:bg-muted/50 transition-colors">
                                  <td className="px-4 py-3 font-medium">{row.userName}</td>
                                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{row.userDepartment || "-"}</td>
                                  <td className="px-4 py-3">
                                    <Select 
                                      value={currentStatus} 
                                      onValueChange={(val: any) => setAttendanceEdits(prev => ({ ...prev, [row.registrationId]: val }))}
                                    >
                                      <SelectTrigger className={`w-[130px] h-8 ${
                                        currentStatus === 'present' ? 'border-green-500 text-green-700 bg-green-50' : 
                                        currentStatus === 'absent' ? 'border-destructive text-destructive bg-destructive/10' : 
                                        'border-amber-500 text-amber-700 bg-amber-50'
                                      }`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="present">Present</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                        <SelectItem value="late">Late</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No attendance records available.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {isOrganizerOrAdmin && event.status === "completed" && (
              <TabsContent value="feedback">
                <Card>
                  <CardHeader>
                    <CardTitle>Post-Event Feedback</CardTitle>
                    <CardDescription>What attendees thought of this event.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {feedback && feedback.length > 0 ? (
                      <div className="space-y-4">
                        {feedback.map(f => (
                          <div key={f.id} className="border rounded-lg p-4 bg-muted/30">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">{f.userName}</div>
                              <div className="flex text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-4 w-4 ${i < f.rating ? "fill-current" : "text-muted-foreground opacity-30"}`} />
                                ))}
                              </div>
                            </div>
                            {f.comment && <p className="text-muted-foreground text-sm">{f.comment}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No feedback submitted yet.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
}
