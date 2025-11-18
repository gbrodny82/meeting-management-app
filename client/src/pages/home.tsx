import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import Dashboard from "./dashboard";

export default function Home() {
  const { user } = useAuth() as { user: User | undefined };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your team meetings.</p>
        </div>
        <Button asChild variant="outline">
          <a href="/api/logout">
            Sign Out
          </a>
        </Button>
      </div>
      
      <Dashboard />
    </div>
  );
}