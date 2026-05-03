import { useState } from "react";
import { useListUsers, useLoginAs, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, University, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Login() {
  const { isLoading: authLoading } = useAuth(false);
  const { data: users, isLoading: usersLoading } = useListUsers();
  const loginAs = useLoginAs();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regRole, setRegRole] = useState("");
  const [regDept, setRegDept] = useState("");
  const [regRegNum, setRegRegNum] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const refreshSession = () =>
    queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });

  const handleDemoLogin = (userId: number) => {
    loginAs.mutate({ data: { userId } }, { onSuccess: refreshSession });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Login failed", description: data.error || "Invalid credentials", variant: "destructive" });
      } else {
        refreshSession();
      }
    } catch {
      toast({ title: "Network error", description: "Could not reach the server.", variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (!regRole) {
      toast({ title: "Please select a role", variant: "destructive" });
      return;
    }
    setRegLoading(true);
    try {
      const body: Record<string, string> = { name: regName, email: regEmail, password: regPassword, role: regRole };
      if (regDept) body["department"] = regDept;
      if (regRegNum) body["registrationNumber"] = regRegNum;
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Registration failed", description: data.error || "Something went wrong", variant: "destructive" });
      } else {
        refreshSession();
      }
    } catch {
      toast({ title: "Network error", description: "Could not reach the server.", variant: "destructive" });
    } finally {
      setRegLoading(false);
    }
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
          <span>CUSIT Peshawar</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-serif font-bold leading-tight tracking-tight mb-4">
            Official Campus Event Management System
          </h1>
          <p className="text-lg text-primary-foreground/80 font-medium">
            Discover, organize, and participate in academic, cultural, and sports events. A centralized platform for the CUSIT Peshawar community.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center bg-background p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-4">
          <div className="flex flex-col space-y-1 text-center lg:text-left">
            <h2 className="text-3xl font-serif font-bold tracking-tight">Welcome</h2>
            <p className="text-muted-foreground">Sign in, create an account, or use a demo.</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
              <TabsTrigger value="demo">Demo</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@cusit.edu.pk"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input id="reg-name" placeholder="Ali Hassan" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" placeholder="you@cusit.edu.pk" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-role">Role</Label>
                  <Select value={regRole} onValueChange={setRegRole} required>
                    <SelectTrigger id="reg-role">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="society_head">Society Head</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-dept">Department <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input id="reg-dept" placeholder="Computer Science" value={regDept} onChange={(e) => setRegDept(e.target.value)} />
                </div>
                {regRole === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="reg-regnum">Registration No. <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input id="reg-regnum" placeholder="FA21-BSE-001" value={regRegNum} onChange={(e) => setRegRegNum(e.target.value)} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Min 8 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">Confirm Password</Label>
                  <Input
                    id="reg-confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={regLoading}>
                  {regLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Account
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="demo" className="mt-6">
              <p className="text-sm text-muted-foreground mb-4">
                Click any account below to instantly log in and explore the system without a password.
              </p>
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                  {roles.map((role) => {
                    const roleUsers = groupedUsers[role];
                    if (!roleUsers || roleUsers.length === 0) return null;
                    return (
                      <motion.div
                        key={role}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: roles.indexOf(role) * 0.07 }}
                        className="space-y-2"
                      >
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
                          {role.replace("_", " ")}
                        </h3>
                        <div className="grid gap-2">
                          {roleUsers.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleDemoLogin(user.id)}
                              disabled={loginAs.isPending}
                              className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-all hover:border-primary hover:shadow-md disabled:opacity-50"
                            >
                              <Avatar className="h-9 w-9 border bg-muted">
                                <AvatarImage src={user.avatarUrl || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                                  {user.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 overflow-hidden">
                                <div className="font-medium text-sm truncate">{user.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                              </div>
                              {user.department && (
                                <Badge variant="secondary" className="hidden sm:inline-flex bg-secondary/20 text-primary hover:bg-secondary/30 text-xs">
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
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
