import { useListEvents } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Search, Clock, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const CATEGORIES = [
  "seminar", "workshop", "competition", "sports", "society", "cultural", "technical"
];

export default function EventsList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  
  const { data: events, isLoading } = useListEvents({
    status: "approved",
    search: search.length > 2 ? search : undefined,
    category: category !== "all" ? category : undefined
  });

  const canCreate = user && ["faculty", "coordinator", "society_head", "admin"].includes(user.role);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">Campus Events</h2>
          <p className="text-muted-foreground">Discover and register for upcoming activities.</p>
        </div>
        
        {canCreate && (
          <Button asChild className="shrink-0">
            <Link href="/events/new" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Propose Event
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search events..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-[350px] animate-pulse bg-muted" />
          ))}
        </div>
      ) : events && events.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden h-full flex flex-col transition-all hover:border-primary hover:shadow-md group">
                <div className="aspect-video relative bg-muted overflow-hidden">
                  {event.bannerUrl ? (
                    <img 
                      src={event.bannerUrl} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                      <Calendar className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                    <Badge className="capitalize bg-background/90 text-foreground backdrop-blur-sm border-none shadow-sm">
                      {event.category}
                    </Badge>
                    <div className="bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-center shadow-sm min-w-[3rem]">
                      <div className="text-xs font-bold text-primary leading-none uppercase">
                        {format(new Date(event.startsAt), "MMM")}
                      </div>
                      <div className="text-lg font-bold leading-none mt-1">
                        {format(new Date(event.startsAt), "d")}
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold text-lg line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                    <Link href={`/events/${event.id}`}>{event.title}</Link>
                  </h3>
                  
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span className="truncate">{format(new Date(event.startsAt), "h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 shrink-0" />
                      <span className="truncate">{event.registrationCount} / {event.capacity} Registered</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/events/${event.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center border rounded-2xl bg-card/50 border-dashed">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-serif text-2xl font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We couldn't find any events matching your search criteria. Try adjusting your filters.
          </p>
          {(search || category !== "all") && (
            <Button variant="outline" className="mt-6" onClick={() => { setSearch(""); setCategory("all"); }}>
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
