import { 
  useGetCurrentUser, 
  useGetDashboardStats, 
  useGetEventsByCategory,
  useGetRegistrationsTrend,
  useGetTopEvents,
  useGetRecentActivity,
  useListEvents,
  useListMyNotifications,
  getGetDashboardStatsQueryKey,
  getGetEventsByCategoryQueryKey,
  getGetRegistrationsTrendQueryKey,
  getGetTopEventsQueryKey,
  getGetRecentActivityQueryKey,
  getListEventsQueryKey,
  getListMyNotificationsQueryKey,
} from "@workspace/api-client-react";
import { AiRecommendations } from "@/components/ai-recommendations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { format } from "date-fns";
import { Calendar, Users, CheckSquare, Award, Clock, ArrowRight, Activity, TrendingUp, Bell } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

function StatCard({ title, value, icon: Icon, description }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: user } = useGetCurrentUser();
  const role = user?.role;

  const isAdminOrFaculty = ["admin", "faculty", "coordinator"].includes(role || "");
  const isStudent = role === "student";

  // Queries for Admin/Faculty
  const { data: stats } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey(), enabled: isAdminOrFaculty } });
  const { data: categoryData } = useGetEventsByCategory({ query: { queryKey: getGetEventsByCategoryQueryKey(), enabled: isAdminOrFaculty } });
  const { data: trendData } = useGetRegistrationsTrend({ days: 14 }, { query: { queryKey: getGetRegistrationsTrendQueryKey({ days: 14 }), enabled: isAdminOrFaculty } });
  const { data: activity } = useGetRecentActivity({ limit: 10 }, { query: { queryKey: getGetRecentActivityQueryKey({ limit: 10 }), enabled: isAdminOrFaculty } });
  const { data: topEvents } = useGetTopEvents({ limit: 5 }, { query: { queryKey: getGetTopEventsQueryKey({ limit: 5 }), enabled: isAdminOrFaculty } });

  // Queries for Students
  const { data: upcomingEvents } = useListEvents({ status: "approved", upcoming: true }, { query: { queryKey: getListEventsQueryKey({ status: "approved", upcoming: true }), enabled: isStudent } });
  const { data: notifications } = useListMyNotifications({ query: { queryKey: getListMyNotificationsQueryKey(), enabled: isStudent } });

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {user.name}. Here's what's happening on campus.</p>
      </div>

      {isAdminOrFaculty && stats && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Events" value={stats.totalEvents} icon={Calendar} description={`${stats.upcomingEvents} upcoming`} />
            <StatCard title="Registrations" value={stats.totalRegistrations} icon={Users} />
            <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={CheckSquare} description="Requires attention" />
            <StatCard title="Certificates Issued" value={stats.totalCertificates} icon={Award} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Registration Trends</CardTitle>
                <CardDescription>Daily registrations over the last 14 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {trendData && trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => format(new Date(val), "MMM d")}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        labelFormatter={(val) => format(new Date(val), "MMM d, yyyy")}
                        contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                      />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Events by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {categoryData && categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="category" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} 
                        width={80}
                      />
                      <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-6">
                    {activity && activity.length > 0 ? activity.map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                          {item.type === "event_created" && <Calendar className="h-4 w-4 text-primary" />}
                          {item.type === "event_approved" && <CheckSquare className="h-4 w-4 text-green-600" />}
                          {item.type === "registration" && <Users className="h-4 w-4 text-blue-600" />}
                          {item.type === "certificate" && <Award className="h-4 w-4 text-amber-600" />}
                          {item.type === "feedback" && <Activity className="h-4 w-4 text-purple-600" />}
                        </div>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{item.message}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(item.timestamp), "MMM d, h:mm a")}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-muted-foreground py-8">No recent activity</div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Top Events</CardTitle>
                <CardDescription>By registration count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topEvents && topEvents.length > 0 ? topEvents.map((event, i) => (
                    <div key={event.eventId} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-1">
                        <p className="font-medium line-clamp-1">{event.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="font-normal capitalize">{event.category}</Badge>
                          <span>{event.attendanceRate.toFixed(0)}% attendance</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-xl">{event.registrationCount}</span>
                        <span className="text-xs text-muted-foreground">regs</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-muted-foreground py-8">No top events to display</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {isStudent && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-semibold">Recommended Events</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/events" className="flex items-center gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {upcomingEvents?.slice(0, 4).map((event) => (
                <Card key={event.id} className="overflow-hidden transition-all hover:border-primary hover:shadow-md">
                  <div className="aspect-[2/1] relative bg-muted">
                    {event.bannerUrl ? (
                      <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                        <Calendar className="h-8 w-8 opacity-50" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 capitalize bg-background/80 text-foreground backdrop-blur border-none">
                      {event.category}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold line-clamp-1 mb-1">{event.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(event.startsAt), "MMM d, yyyy")}</span>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/events/${event.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {upcomingEvents?.length === 0 && (
                <div className="col-span-2 py-12 text-center border rounded-xl bg-card border-dashed">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg">No upcoming events</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                    Check back later for new seminars, workshops, and campus activities.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <AiRecommendations />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5" /> Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications?.slice(0, 5).map((note) => (
                    <div key={note.id} className="flex gap-3 border-b last:border-0 pb-3 last:pb-0">
                      <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${note.isRead ? 'bg-muted' : 'bg-primary'}`} />
                      <div>
                        <p className="text-sm font-medium leading-none mb-1">{note.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{note.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(note.createdAt), "MMM d")}</p>
                      </div>
                    </div>
                  ))}
                  {notifications?.length === 0 && (
                    <div className="text-center text-muted-foreground py-4 text-sm">No notifications yet</div>
                  )}
                  {notifications && notifications.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                      <Link href="/notifications">View all</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
