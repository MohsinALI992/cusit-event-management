import { useState } from "react";
import { useRecommendEvents } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Star, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function AiRecommendations() {
  const [enabled, setEnabled] = useState(false);
  const { data, isLoading, refetch } = useRecommendEvents({ query: { enabled } });

  const handleLoad = () => {
    if (enabled) {
      refetch();
    } else {
      setEnabled(true);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">AI Event Picks</CardTitle>
              <CardDescription className="text-xs">Personalized for you</CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant={enabled ? "outline" : "default"}
            onClick={handleLoad}
            disabled={isLoading}
            className="h-8 text-xs"
          >
            {isLoading ? (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : enabled ? (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isLoading ? "Thinking…" : enabled ? "Refresh" : "Get Picks"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {!enabled && !isLoading && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Click "Get Picks" for AI-powered event recommendations based on your interests.</p>
          </div>
        )}

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-3 animate-pulse bg-muted/40">
                <div className="h-4 w-2/3 bg-muted rounded mb-2" />
                <div className="h-3 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        )}

        {data && !isLoading && (
          <>
            {data.recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{data.reasoning}</p>
            ) : (
              <>
                <div className="space-y-2">
                  {data.recommendations.map((rec, i) => (
                    <Link key={i} href={`/events/${rec.eventId}`}>
                      <div className="group flex items-start gap-3 rounded-lg border bg-background p-3 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium truncate">{rec.title}</p>
                            <Badge variant="outline" className={cn("text-xs shrink-0", scoreColor(rec.matchScore))}>
                              <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                              {rec.matchScore}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                      </div>
                    </Link>
                  ))}
                </div>
                {data.reasoning && (
                  <p className="text-xs text-muted-foreground italic px-1 pt-1">{data.reasoning}</p>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
