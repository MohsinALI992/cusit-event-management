import { 
  useGetDashboardStats, 
  useGetEventsByCategory,
  useGetRegistrationsTrend,
  useGetTopEvents,
  useListEvents,
  useGetEventReport,
  getGetDashboardStatsQueryKey,
  getGetEventsByCategoryQueryKey,
  getGetRegistrationsTrendQueryKey,
  getGetTopEventsQueryKey,
  getListEventsQueryKey,
  getGetEventReportQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, LineChart, Line, CartesianGrid, Cell, PieChart, Pie, Legend } from "recharts";
import { format } from "date-fns";
import { Calendar, Users, Award, Star, Activity, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  "hsl(var(--chart-1))", 
  "hsl(var(--chart-2))", 
  "hsl(var(--chart-3))", 
  "hsl(var(--chart-4))", 
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--secondary))"
];

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

export default function Reports() {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  
  const isAdminOrFaculty = user && ["admin", "faculty"].includes(user.role);

  // Overall stats
  const { data: stats } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey(), enabled: !!isAdminOrFaculty && selectedEventId === "all" } });
  const { data: categoryData } = useGetEventsByCategory({ query: { queryKey: getGetEventsByCategoryQueryKey(), enabled: !!isAdminOrFaculty && selectedEventId === "all" } });
  const { data: trendData } = useGetRegistrationsTrend({ days: 30 }, { query: { queryKey: getGetRegistrationsTrendQueryKey({ days: 30 }), enabled: !!isAdminOrFaculty && selectedEventId === "all" } });
  const { data: topEvents } = useGetTopEvents({ limit: 10 }, { query: { queryKey: getGetTopEventsQueryKey({ limit: 10 }), enabled: !!isAdminOrFaculty && selectedEventId === "all" } });

  // For event selection
  const { data: allEvents } = useListEvents({ status: "completed" }, { query: { queryKey: getListEventsQueryKey({ status: "completed" }), enabled: !!isAdminOrFaculty } });
  
  // Specific event report
  const eventIdNumber = parseInt(selectedEventId);
  const { data: eventReport, isLoading: isReportLoading } = useGetEventReport(eventIdNumber, { 
    query: { queryKey: getGetEventReportQueryKey(eventIdNumber), enabled: !!isAdminOrFaculty && selectedEventId !== "all" && !isNaN(eventIdNumber) } 
  });

  if (!user || !["admin", "faculty"].includes(user.role)) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">System Reports</h2>
          <p className="text-muted-foreground">Comprehensive analytics for campus events.</p>
        </div>
        
        <div className="w-full sm:w-[300px]">
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Event Report" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Overall System Analytics</SelectItem>
              {allEvents?.map(event => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedEventId === "all" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Active Users" value={stats?.activeUsers || 0} icon={Users} />
            <StatCard title="Total Registrations" value={stats?.totalRegistrations || 0} icon={Activity} />
            <StatCard title="Certificates Issued" value={stats?.totalCertificates || 0} icon={Award} />
            <StatCard title="Avg Feedback" value={`${stats?.avgFeedbackRating?.toFixed(1) || "0.0"}/5.0`} icon={Star} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Registration Trends (30 Days)</CardTitle>
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
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Events Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {categoryData && categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="category"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} 
                      />
                      <Legend formatter={(value) => <span className="capitalize">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Events</CardTitle>
              <CardDescription>Based on registration numbers and attendance rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Event Title</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium text-right">Registrations</th>
                      <th className="px-4 py-3 font-medium text-right">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {topEvents?.map((event) => (
                      <tr key={event.eventId} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{event.title}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{event.category}</Badge></td>
                        <td className="px-4 py-3 text-right">{event.registrationCount}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${event.attendanceRate}%` }} 
                              />
                            </div>
                            <span className="w-9">{event.attendanceRate.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!topEvents || topEvents.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : isReportLoading ? (
        <div className="h-[400px] flex items-center justify-center">Loading event report...</div>
      ) : eventReport ? (
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div>
                  <Badge className="mb-2 capitalize bg-primary">{eventReport.event.category}</Badge>
                  <h3 className="text-2xl font-serif font-bold mb-1">{eventReport.event.title}</h3>
                  <p className="text-muted-foreground mb-4">Organized by {eventReport.event.organizerName}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(new Date(eventReport.event.startsAt), "MMM d, yyyy")}</div>
                    <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {eventReport.event.capacity} Capacity</div>
                  </div>
                </div>
                <div className="bg-background rounded-xl p-4 border shadow-sm shrink-0 flex flex-col items-center justify-center min-w-[150px]">
                  <div className="text-3xl font-bold text-primary flex items-center gap-1">
                    {eventReport.avgRating.toFixed(1)} <Star className="h-6 w-6 fill-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">from {eventReport.feedbackCount} reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Registrations" value={eventReport.registrationCount} icon={Users} />
            <StatCard title="Attended" value={eventReport.attendedCount} icon={Activity} description={`${((eventReport.attendedCount / Math.max(1, eventReport.registrationCount)) * 100).toFixed(1)}% attendance rate`} />
            <StatCard title="Absent" value={eventReport.absentCount} icon={ArrowUpRight} />
            <StatCard title="Certificates Issued" value={eventReport.certificatesIssued} icon={Award} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Attended', value: eventReport.attendedCount },
                        { name: 'Absent', value: eventReport.absentCount }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="hsl(var(--chart-2))" />
                      <Cell fill="hsl(var(--destructive))" />
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Funnel Analysis</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { stage: 'Capacity', count: eventReport.event.capacity },
                      { stage: 'Registered', count: eventReport.registrationCount },
                      { stage: 'Attended', count: eventReport.attendedCount },
                      { stage: 'Certificates', count: eventReport.certificatesIssued }
                    ]}
                    layout="vertical"
                    margin={{ left: 30, right: 20 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: "8px" }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                      <Cell fill="hsl(var(--muted))" />
                      <Cell fill="hsl(var(--primary))" opacity={0.6} />
                      <Cell fill="hsl(var(--primary))" opacity={0.8} />
                      <Cell fill="hsl(var(--primary))" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
