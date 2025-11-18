import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateAction } from "@/hooks/use-actions";
import { useToast } from "@/hooks/use-toast";
import { Action, ActionStatus, ActionPriority } from "@shared/schema";
import { useLocation } from "wouter";

interface ActionItemProps {
  action: Action;
}

export default function ActionItem({ action }: ActionItemProps) {
  const updateAction = useUpdateAction();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateAction.mutateAsync({
        id: action.id,
        updates: { status: newStatus }
      });
      toast({
        title: "Success",
        description: "Action status updated!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update action status",
        variant: "destructive",
      });
    }
  };

  const handleViewMeeting = () => {
    if (action.meetingId) {
      setLocation(`/meetings/${action.meetingId}?action=${action.id}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case ActionPriority.HIGH:
        return "border-l-red-500 bg-red-50";
      case ActionPriority.MEDIUM:
        return "border-l-yellow-500 bg-yellow-50";
      case ActionPriority.LOW:
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-gray-500 bg-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case ActionStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case ActionStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800";
      case ActionStatus.PENDING:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`p-4 rounded-lg shadow-sm border-l-4 mb-3 ${getPriorityColor(action.priority)} ${
      action.status === ActionStatus.COMPLETED ? 'opacity-75' : ''
    }`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{action.text}</h4>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
            {action.status === 'in-progress' ? 'In Progress' : 
             action.status.charAt(0).toUpperCase() + action.status.slice(1)}
          </span>
          <Select value={action.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ActionStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={ActionStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={ActionStatus.COMPLETED}>Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>
          <strong>Priority:</strong> {action.priority} | 
          <strong> Assigned to:</strong> {action.assignee} | 
          <strong> From:</strong> {action.employeeName}
        </p>
        {action.status === ActionStatus.IN_PROGRESS && (
          <p className="text-blue-600 mt-1">🔄 In Progress</p>
        )}
        {action.meetingId && (
          <Button
            variant="link"
            size="sm"
            onClick={handleViewMeeting}
            className="text-blue-600 hover:text-blue-800 p-0 h-auto mt-2"
          >
            📝 View Meeting Notes
          </Button>
        )}
      </div>
    </div>
  );
}
