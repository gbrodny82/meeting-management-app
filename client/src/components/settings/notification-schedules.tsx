import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Clock, Calendar, Settings } from "lucide-react";
import { SchedulePresets } from "@shared/schema";

interface NotificationSchedule {
  id: number;
  name: string;
  cronPattern: string;
  isActive: boolean;
  notificationType: string;
  includeActions: boolean;
  includeMeetings: boolean;
  includeStats: boolean;
  customMessage?: string;
}

interface NotificationSchedulesProps {
  schedules: NotificationSchedule[];
  onUpdate: () => void;
}

export default function NotificationSchedules({ schedules, onUpdate }: NotificationSchedulesProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    cronPattern: '',
    isActive: true,
    notificationType: 'daily',
    includeActions: true,
    includeMeetings: true,
    includeStats: true,
    customMessage: ''
  });
  const { toast } = useToast();

  const handleCreateSchedule = async () => {
    try {
      const response = await fetch('/api/notification-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSchedule)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Notification schedule created!",
        });
        setShowAddForm(false);
        setNewSchedule({
          name: '',
          cronPattern: '',
          isActive: true,
          notificationType: 'daily',
          includeActions: true,
          includeMeetings: true,
          includeStats: true,
          customMessage: ''
        });
        onUpdate();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create schedule');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create schedule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      const response = await fetch(`/api/notification-schedules/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok || response.status === 204) {
        toast({
          title: "Success",
          description: "Notification schedule deleted!",
        });
        onUpdate();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive",
      });
    }
  };

  const handleToggleSchedule = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/notification-schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Schedule ${isActive ? 'enabled' : 'disabled'}!`,
        });
        onUpdate();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    }
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset = SchedulePresets[presetKey as keyof typeof SchedulePresets];
    if (preset) {
      setNewSchedule(prev => ({
        ...prev,
        name: preset.name,
        cronPattern: preset.cronPattern
      }));
    }
  };

  const getCronDescription = (cronPattern: string) => {
    // Simple cron pattern descriptions for common patterns
    const patterns: { [key: string]: string } = {
      "0 9 * * 1-5": "Daily at 9:00 AM, Monday through Friday",
      "0 17 * * 1-5": "Daily at 5:00 PM, Monday through Friday",
      "0 8 * * 1": "Every Monday at 8:00 AM",
      "0 16 * * 5": "Every Friday at 4:00 PM",
      "0 9 * * *": "Daily at 9:00 AM",
      "0 18 * * *": "Daily at 6:00 PM"
    };
    return patterns[cronPattern] || "Custom schedule";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Notification Schedules</h3>
          <p className="text-sm text-gray-600">Set up multiple notification schedules for different times and content</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Schedule
        </Button>
      </div>

      {/* Existing Schedules */}
      <div className="space-y-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium">{schedule.name}</h4>
                    <Switch
                      checked={schedule.isActive}
                      onCheckedChange={(checked) => handleToggleSchedule(schedule.id, checked)}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {getCronDescription(schedule.cronPattern)}
                  </p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    {schedule.includeActions && <span>✓ Actions</span>}
                    {schedule.includeMeetings && <span>✓ Meetings</span>}
                    {schedule.includeStats && <span>✓ Stats</span>}
                  </div>
                  {schedule.customMessage && (
                    <p className="text-sm text-gray-600 mt-2 italic">"{schedule.customMessage}"</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSchedule(schedule.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {schedules.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notification schedules configured</p>
            <p className="text-sm">Add your first schedule to get started</p>
          </div>
        )}
      </div>

      {/* Add Schedule Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Create New Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schedule-name">Schedule Name</Label>
                <Input
                  id="schedule-name"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Morning Update"
                />
              </div>
              <div>
                <Label htmlFor="preset-select">Quick Presets</Label>
                <Select onValueChange={handlePresetSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SchedulePresets).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="cron-pattern">Cron Pattern</Label>
              <Input
                id="cron-pattern"
                value={newSchedule.cronPattern}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, cronPattern: e.target.value }))}
                placeholder="0 9 * * 1-5"
              />
              <p className="text-xs text-gray-500 mt-1">
                {newSchedule.cronPattern ? getCronDescription(newSchedule.cronPattern) : "Format: minute hour day month weekday"}
              </p>
            </div>

            <div>
              <Label>Content to Include</Label>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2">
                  <Switch
                    checked={newSchedule.includeActions}
                    onCheckedChange={(checked) => setNewSchedule(prev => ({ ...prev, includeActions: checked }))}
                  />
                  <span className="text-sm">Action Items</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={newSchedule.includeMeetings}
                    onCheckedChange={(checked) => setNewSchedule(prev => ({ ...prev, includeMeetings: checked }))}
                  />
                  <span className="text-sm">Meetings</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={newSchedule.includeStats}
                    onCheckedChange={(checked) => setNewSchedule(prev => ({ ...prev, includeStats: checked }))}
                  />
                  <span className="text-sm">Statistics</span>
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="custom-message">Custom Message (Optional)</Label>
              <Textarea
                id="custom-message"
                value={newSchedule.customMessage}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, customMessage: e.target.value }))}
                placeholder="Add a personal message to your notifications..."
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreateSchedule} disabled={!newSchedule.name || !newSchedule.cronPattern}>
                Create Schedule
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}