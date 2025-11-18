import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActions, useUpdateAction } from "@/hooks/use-actions";
import { useMeetings } from "@/hooks/use-meetings";
import { useToast } from "@/hooks/use-toast";
import { ActionPriority, ActionStatus } from "@shared/schema";
import { useLocation } from "wouter";

export default function PriorityActions() {
  const { data: actions = [] } = useActions();
  const { data: meetings = [] } = useMeetings();
  const updateAction = useUpdateAction();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const priorityActions = actions
    .filter(action => action.status !== ActionStatus.COMPLETED)
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      if (a.assignee === 'me' && b.assignee !== 'me') return -1;
      if (a.assignee !== 'me' && b.assignee === 'me') return 1;
      return 0;
    })
    .slice(0, 5);

  const handleMarkComplete = async (actionId: number) => {
    try {
      await updateAction.mutateAsync({
        id: actionId,
        updates: { status: ActionStatus.COMPLETED }
      });
      toast({
        title: "Success",
        description: "Action marked as complete!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update action",
        variant: "destructive",
      });
    }
  };

  const handleViewMeeting = (actionId: number) => {
    const action = actions.find(a => a.id === actionId);
    if (action?.meetingId) {
      setLocation(`/meetings?highlight=${action.meetingId}`);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case ActionPriority.HIGH:
        return "priority-badge-high";
      case ActionPriority.MEDIUM:
        return "priority-badge-medium";
      case ActionPriority.LOW:
        return "priority-badge-low";
      default:
        return "priority-badge-medium";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case ActionStatus.PENDING:
        return "status-badge-pending";
      case ActionStatus.IN_PROGRESS:
        return "status-badge-in-progress";
      case ActionStatus.COMPLETED:
        return "status-badge-completed";
      default:
        return "status-badge-pending";
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Priority Action Items</CardTitle>
        <Button variant="ghost" onClick={() => setLocation('/actions')}>
          View All
        </Button>
      </CardHeader>
      <CardContent className="divide-y divide-gray-200">
        {priorityActions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No active action items
          </div>
        ) : (
          priorityActions.map((action) => (
            <div key={action.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className={getPriorityBadge(action.priority)}>
                    {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{action.text}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Assigned to: {action.assignee} • From: {action.employeeName}
                  </p>
                  <div className="mt-2 flex items-center space-x-2">
                    {action.assignee === 'me' && action.status !== ActionStatus.COMPLETED && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleMarkComplete(action.id)}
                        disabled={updateAction.isPending}
                      >
                        Mark Complete
                      </Button>
                    )}
                    {action.meetingId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewMeeting(action.id)}
                      >
                        View Meeting
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className={getStatusBadge(action.status)}>
                    {action.status === 'in-progress' ? 'In Progress' : 
                     action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
