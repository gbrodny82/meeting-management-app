import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/app-context";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/main-layout";
import Dashboard from "@/pages/dashboard";
import Actions from "@/pages/actions";
import Meetings from "@/pages/meetings";
import Team from "@/pages/team";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";
import Notifications from "@/pages/notifications";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import AccessDenied from "@/pages/access-denied";
import { AchievementsPage } from "@/pages/achievements";

function Router() {
  const [location] = useLocation();
  
  // Show access denied page immediately without auth checks to prevent loops
  if (location === '/access-denied') {
    return <AccessDenied />;
  }

  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/access-denied" component={AccessDenied} />
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <MainLayout>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/actions" component={Actions} />
          <Route path="/meetings" component={Meetings} />
          <Route path="/meetings/:id" component={Meetings} />
          <Route path="/team" component={Team} />
          <Route path="/achievements" component={AchievementsPage} />
          <Route path="/settings" component={Settings} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/admin" component={Admin} />
        </MainLayout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
