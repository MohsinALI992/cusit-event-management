import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import EventsList from "@/pages/events/index";
import NewEvent from "@/pages/events/new";
import EventDetail from "@/pages/events/detail";
import Approvals from "@/pages/approvals";
import MyRegistrations from "@/pages/my-registrations";
import MyCertificates from "@/pages/my-certificates";
import Notifications from "@/pages/notifications";
import Reports from "@/pages/reports";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  return (
    <Route {...rest}>
      <Layout>
        <Component />
      </Layout>
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/events" component={EventsList} />
      <ProtectedRoute path="/events/new" component={NewEvent} />
      <ProtectedRoute path="/events/:id" component={EventDetail} />
      <ProtectedRoute path="/approvals" component={Approvals} />
      <ProtectedRoute path="/my-registrations" component={MyRegistrations} />
      <ProtectedRoute path="/my-certificates" component={MyCertificates} />
      <ProtectedRoute path="/notifications" component={Notifications} />
      <ProtectedRoute path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
