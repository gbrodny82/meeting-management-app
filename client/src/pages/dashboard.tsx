import { useState } from "react";
import { CheckSquare, Calendar, Clock, Users, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatsCard from "@/components/dashboard/stats-card";
import PriorityActions from "@/components/dashboard/priority-actions";
import RecentMeetings from "@/components/dashboard/recent-meetings";
import QuickActions from "@/components/dashboard/quick-actions";
import TeamInsights from "@/components/insights/team-insights";
import MeetingForm from "@/components/meetings/meeting-form";
import { AchievementNotification } from "@/components/achievements/achievement-notification";
import { useStats } from "@/hooks/use-actions";
import { useUserAchievements, getNewAchievementsCount } from "@/hooks/use-achievements";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();
  const [, setLocation] = useLocation();
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const { data: achievements = [] } = useUserAchievements();

  const handleMeetingSuccess = () => {
    setShowMeetingDialog(false);
  };

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3 mb-6"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Achievement Notification */}
        {getNewAchievementsCount(achievements) > 0 && (
          <div className="mb-6">
            <AchievementNotification achievements={achievements} />
          </div>
        )}

        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your meetings and action items in one place
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Button 
              variant="outline"
              onClick={() => setLocation('/settings?tab=export')}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setShowMeetingDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Meeting
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Active Actions"
            value={stats?.activeActions || 0}
            icon={CheckSquare}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatsCard
            title="Total Meetings"
            value={stats?.totalMeetings || 0}
            icon={Calendar}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatsCard
            title="Overdue Items"
            value={stats?.overdueActions || 0}
            icon={Clock}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
          />
          <StatsCard
            title="Team Members"
            value={stats?.totalEmployees || 0}
            icon={Users}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PriorityActions />
          
          {/* Sidebar Widgets */}
          <div className="space-y-6">
            <RecentMeetings />
            <QuickActions />
            
            {/* Upcoming Reminders */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Reminders</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        High priority actions need attention
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats?.overdueActions} overdue items
                      </p>
                    </div>
                  </div>
                  {stats?.activeActions === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">All caught up! 🎉</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Insights Section */}
        <div className="mt-6">
          <TeamInsights />
        </div>
      </div>

      {/* Meeting Creation Dialog */}
      <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Meeting</DialogTitle>
          </DialogHeader>
          <MeetingForm 
            onSuccess={handleMeetingSuccess} 
            onCancel={() => setShowMeetingDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
