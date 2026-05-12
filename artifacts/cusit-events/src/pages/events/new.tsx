import { useCreateEvent, useGenerateEventDescription, getListEventsQueryKey } from "@workspace/api-client-react";
import { CreateEventBody } from "@workspace/api-zod";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Type, Info, Image as ImageIcon, Users, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function NewEvent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateEvent();
  const generateDesc = useGenerateEventDescription();
  const [aiGenerating, setAiGenerating] = useState(false);

  const form = useForm({
    resolver: zodResolver(CreateEventBody),
    defaultValues: {
      title: "",
      description: "",
      category: "seminar" as any,
      startsAt: "",
      endsAt: "",
      venue: "",
      capacity: 50,
      bannerUrl: ""
    }
  });

  if (!user || user.role === "student") {
    return <div>Unauthorized</div>;
  }

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      startsAt: new Date(data.startsAt).toISOString(),
      endsAt: new Date(data.endsAt).toISOString(),
    };

    createMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast({ title: "Event Proposed", description: "Your event has been submitted for approval." });
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          setLocation("/events");
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create event. Please check the form.", variant: "destructive" });
        }
      }
    );
  };

  const handleGenerateDescription = async () => {
    const title = form.getValues("title");
    const category = form.getValues("category");
    const venue = form.getValues("venue");

    if (!title || !category) {
      toast({ title: "Missing info", description: "Please fill in the event title and category first.", variant: "destructive" });
      return;
    }

    setAiGenerating(true);
    try {
      const result = await generateDesc.mutateAsync({ data: { title, category, venue: venue || undefined } });
      form.setValue("description", result.description, { shouldValidate: true });
      toast({ title: "Description generated!", description: "AI has written a description for your event. Feel free to edit it." });
    } catch {
      toast({ title: "Generation failed", description: "Could not generate description. Please try again.", variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight">Propose New Event</h2>
        <p className="text-muted-foreground">Fill out the details below to submit an event for approval.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Provide comprehensive information to help students decide to register.</CardDescription>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <Sparkles className="h-3 w-3" />
              AI-assisted
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Type className="h-4 w-4" /> Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Annual Tech Symposium 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="seminar">Seminar</SelectItem>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="competition">Competition</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="society">Society</SelectItem>
                          <SelectItem value="cultural">Cultural</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4" /> Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Start Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4" /> End Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Main Auditorium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="flex items-center gap-2"><Info className="h-4 w-4" /> Description</FormLabel>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateDescription}
                        disabled={aiGenerating}
                        className="h-7 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
                      >
                        {aiGenerating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        {aiGenerating ? "Generating…" : "Generate with AI"}
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed information about what attendees can expect, or click 'Generate with AI' above…" 
                        className="min-h-[140px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bannerUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Banner Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" type="button" onClick={() => setLocation("/events")}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Submitting..." : "Submit Proposal"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
