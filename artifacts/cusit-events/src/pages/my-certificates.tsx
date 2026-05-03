import { useListMyCertificates, getListMyCertificatesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Award, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function MyCertificates() {
  const { user } = useAuth();
  const { data: certificates, isLoading } = useListMyCertificates({
    query: { queryKey: getListMyCertificatesQueryKey(), enabled: !!user && user.role === "student" }
  });

  if (user?.role !== "student") {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight">My Certificates</h2>
        <p className="text-muted-foreground">View and download your earned event certificates.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-[200px] animate-pulse bg-muted" />
          ))}
        </div>
      ) : certificates && certificates.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Dialog key={cert.id}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer overflow-hidden transition-all hover:shadow-md hover:border-primary group">
                  <div className="h-24 bg-primary/10 flex items-center justify-center relative">
                    <Award className="h-10 w-10 text-primary opacity-50 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  </div>
                  <CardContent className="p-5 -mt-6 relative z-10">
                    <div className="bg-background rounded-lg border p-4 shadow-sm h-full flex flex-col">
                      <h3 className="font-bold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {cert.event.title}
                      </h3>
                      <div className="space-y-2 mb-4 text-sm text-muted-foreground flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span className="truncate">{format(new Date(cert.event.startsAt), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-3 border-t">
                        <div className="text-xs font-mono text-muted-foreground">
                          ID: {cert.code}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-3xl p-0 overflow-hidden border-none bg-transparent shadow-none">
                <div className="bg-[#FAF9F6] p-12 text-center relative border-[12px] border-double border-primary/20 shadow-2xl rounded-sm">
                  <div className="absolute top-8 left-8 bottom-8 right-8 border-2 border-primary/30" />
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-8 shadow-lg">
                      <Award className="h-10 w-10 text-primary-foreground" />
                    </div>
                    
                    <h2 className="text-4xl font-serif font-bold text-primary tracking-widest uppercase mb-2">
                      Certificate of Participation
                    </h2>
                    <p className="text-muted-foreground uppercase tracking-widest text-sm mb-12">
                      CUSIT Peshawar
                    </p>
                    
                    <p className="text-xl text-foreground/80 italic mb-4">This is to certify that</p>
                    <h3 className="text-3xl font-serif font-bold border-b border-primary/30 pb-2 px-12 mb-8 inline-block">
                      {user.name}
                    </h3>
                    
                    <p className="text-xl text-foreground/80 italic mb-4">has successfully participated in</p>
                    <h4 className="text-2xl font-bold text-primary mb-8 max-w-2xl mx-auto">
                      {cert.event.title}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-16 w-full max-w-lg mx-auto mt-8">
                      <div>
                        <p className="border-b border-primary/30 pb-2 text-lg font-medium">
                          {format(new Date(cert.event.startsAt), "MMMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">Date</p>
                      </div>
                      <div>
                        <p className="border-b border-primary/30 pb-2 text-lg font-medium font-mono">
                          {cert.code}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">Certificate ID</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-4">
                  <Button variant="secondary" className="shadow-lg" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Print Certificate
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center border rounded-2xl bg-card/50 border-dashed">
          <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <Award className="h-8 w-8" />
          </div>
          <h3 className="font-serif text-2xl font-semibold mb-2">No Certificates Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            You haven't earned any certificates yet. Attend events and get your attendance marked to earn certificates.
          </p>
        </div>
      )}
    </div>
  );
}
