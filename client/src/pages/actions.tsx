import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ActionItem from "@/components/actions/action-item";
import { useActions } from "@/hooks/use-actions";
import { ActionStatus } from "@shared/schema";

export default function Actions() {
  const { data: actions = [], isLoading } = useActions();
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'my' | 'team' | 'completed'>('active');

  const filteredActions = actions.filter(action => {
    switch (activeFilter) {
      case 'active':
        return action.status !== ActionStatus.COMPLETED;
      case 'my':
        return action.assignee === 'me' && action.status !== ActionStatus.COMPLETED;
      case 'team':
        return action.assignee !== 'me' && action.status !== ActionStatus.COMPLETED;
      case 'completed':
        return action.status === ActionStatus.COMPLETED;
      case 'all':
      default:
        return true;
    }
  }).sort((a, b) => {
    // Sort completed tasks to the bottom
    if (a.status === ActionStatus.COMPLETED && b.status !== ActionStatus.COMPLETED) {
      return 1; // a goes after b
    }
    if (a.status !== ActionStatus.COMPLETED && b.status === ActionStatus.COMPLETED) {
      return -1; // a goes before b
    }
    
    // For tasks with the same completion status, sort by priority (high -> medium -> low)
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Finally sort by ID (newer IDs first for incomplete tasks)
    return b.id - a.id;
  });

  const allActiveTasks = actions.filter(a => a.status !== ActionStatus.COMPLETED);
  const myActiveTasks = actions.filter(a => a.assignee === 'me' && a.status !== ActionStatus.COMPLETED);
  const teamActiveTasks = actions.filter(a => a.assignee !== 'me' && a.status !== ActionStatus.COMPLETED);
  const completedTasks = actions.filter(a => a.status === ActionStatus.COMPLETED);

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Action Items
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track all action items across meetings
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('all')}
            data-testid="filter-all-actions"
          >
            All ({actions.length})
          </Button>
          <Button
            variant={activeFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('active')}
            data-testid="filter-active-actions"
            className={activeFilter === 'active' ? 
              "bg-green-600 hover:bg-green-700 text-white border-green-600" : 
              "border-green-200 text-green-700 hover:bg-green-50"
            }
          >
            Active Only ({allActiveTasks.length})
          </Button>
          <Button
            variant={activeFilter === 'my' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('my')}
            data-testid="filter-my-actions"
          >
            My Tasks ({myActiveTasks.length})
          </Button>
          <Button
            variant={activeFilter === 'team' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('team')}
            data-testid="filter-team-actions"
          >
            Team Tasks ({teamActiveTasks.length})
          </Button>
          <Button
            variant={activeFilter === 'completed' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('completed')}
            data-testid="filter-completed-actions"
          >
            Completed ({completedTasks.length})
          </Button>
        </div>

        {/* Quick Stats */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-8">
                <div>
                  <span className="text-2xl font-bold text-blue-600">{myActiveTasks.length}</span>
                  <p className="text-sm text-gray-600">My Active Tasks</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-green-600">{teamActiveTasks.length}</span>
                  <p className="text-sm text-gray-600">Team Active Tasks</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-600">{completedTasks.length}</span>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions List */}
        {filteredActions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <h3 className="text-lg font-medium mb-2">No action items found</h3>
                <p>
                  {activeFilter === 'all' ? 
                    "No action items have been created yet." :
                  activeFilter === 'active' ?
                    "All action items have been completed! Great job!" :
                    `No ${activeFilter} action items found.`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredActions.map((action) => (
              <ActionItem key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
