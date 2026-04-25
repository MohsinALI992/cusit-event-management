import { useListUsers, useLoginAs, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, University } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { isLoading: authLoading } = useAuth(false);
  const { data: users, isLoading: usersLoading } = useListUsers();
  const loginAs = useLoginAs();
  const queryClient = useQueryClient();

  if (authLoading || usersLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogin = (userId: number) => {
    loginAs.mutate(
      { data: { userId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        },
      }
    );
  };

  const groupedUsers = users?.reduce((acc, user) => {
    const role = user.role;
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<string, typeof users>) || {};

  const roles = ["student", "faculty", "coordinator", "society_head", "admin"];

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <div className="relative hidden lg:flex flex-1 flex-col justify-between bg-primary p-10 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/login-hero.png" 
            alt="CUSIT Campus" 
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent" />
        </div>
        
        <div className="relative z-10 flex items-center gap-3 font-serif text-2xl font-bold text-secondary">
          <University className="h-8 w-8" />
          <span>CUSIT Sahiwal</span>
        </div>
        
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-serif font-bold leading-tight tracking-tight mb-4">
            Official Campus Event Management System
          </h1>
          <p className="text-lg text-primary-foreground/80 font-medium">
            Discover, organize, and participate in academic, cultural, and sports events. A centralized platform for the COMSATS community.
          </p>
        </div>
      </div>
      
      <div className="flex flex-1 items-center justify-center bg-background p-6 lg:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-serif font-bold tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground">Select a demo account to access the portal.</p>
          </div>
          
          <div className="space-y-6">
            {roles.map((role) => {
              const roleUsers = groupedUsers[role];
              if (!roleUsers || roleUsers.length === 0) return null;
              
              return (
                <motion.div 
                  key={role} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: roles.indexOf(role) * 0.1 }}
                  className="space-y-3"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
                    {role.replace("_", " ")}
                  </h3>
                  <div className="grid gap-3">
                    {roleUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleLogin(user.id)}
                        disabled={loginAs.isPending}
                        className="flex items-center gap-4 rounded-xl border bg-card p-3 text-left transition-all hover:border-primary hover:shadow-md disabled:opacity-50"
                      >
                        <Avatar className="h-10 w-10 border bg-muted">
                          <AvatarImage src={user.avatarUrl || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-medium truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>
                        {user.department && (
                          <Badge variant="secondary" className="hidden sm:inline-flex bg-secondary/20 text-primary hover:bg-secondary/30">
                            {user.department}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
