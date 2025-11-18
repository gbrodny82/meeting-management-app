import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useActions } from "@/hooks/use-actions";
import { useMeetings } from "@/hooks/use-meetings";
import { useEmployees } from "@/hooks/use-employees";
import { Download, Upload, Trash2, Bell, FileText } from "lucide-react";
import NotificationSchedules from "@/components/settings/notification-schedules";
import { EmailSettings } from "@/components/settings/email-settings";
import { useNotificationSchedules } from "@/hooks/use-notification-schedules";

export default function Settings() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { data: actions = [] } = useActions();
  const { data: meetings = [] } = useMeetings();
  const { data: employees = [] } = useEmployees();
  const { data: schedules = [], refetch: refetchSchedules } = useNotificationSchedules();

  const [activeTab, setActiveTab] = useState('general');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem('notificationsEnabled') === 'true'
  );
  const [notificationTime, setNotificationTime] = useState(
    localStorage.getItem('notificationTime') || '09:00'
  );
  const [exportData, setExportData] = useState('');
  const [templateData, setTemplateData] = useState('');
  const [clearConfirm, setClearConfirm] = useState(false);

  // Check URL params for active tab
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const tab = params.get('tab');
    if (tab && ['general', 'notifications', 'schedules', 'email', 'export', 'import'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  const saveNotificationSettings = () => {
    localStorage.setItem('notificationsEnabled', notificationsEnabled.toString());
    localStorage.setItem('notificationTime', notificationTime);
    toast({
      title: "Success",
      description: `Notification settings saved: ${notificationsEnabled ? 'Enabled' : 'Disabled'} at ${notificationTime}`,
    });
  };

  const testNotification = () => {
    if (!('Notification' in window)) {
      toast({
        title: "Error",
        description: "Browser does not support notifications",
        variant: "destructive",
      });
      return;
    }

    const activeActions = actions.filter(a => a.status !== 'completed');
    if (activeActions.length === 0) {
      toast({
        title: "Info",
        description: "No active actions to notify about",
      });
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification('📋 Daily Actions Test', {
          body: `You have ${activeActions.length} active actions`,
          icon: '📋'
        });
        setTimeout(() => notification.close(), 5000);
        toast({
          title: "Success",
          description: "Test notification sent!",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to create notification: ${error}`,
          variant: "destructive",
        });
      }
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          testNotification();
        } else {
          toast({
            title: "Error",
            description: "Notification permission denied",
            variant: "destructive",
          });
        }
      });
    } else {
      toast({
        title: "Error",
        description: "Notifications blocked. Enable in browser settings.",
        variant: "destructive",
      });
    }
  };

  const generateTemplate = () => {
    const activeActions = actions
      .filter(a => a.status !== 'completed')
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

    if (activeActions.length === 0) {
      toast({
        title: "Info",
        description: "No active actions to create template for",
      });
      return;
    }

    const date = new Date().toLocaleDateString();
    let template = `📋 Daily Action Items - ${date}\n\n`;
    
    activeActions.forEach((action, index) => {
      const priorityEmoji = action.priority === 'high' ? '🔴' : 
                           action.priority === 'medium' ? '🟡' : '🟢';
      const assigneeText = action.assignee === 'me' ? '(Me)' : `(${action.assignee})`;
      
      template += `${index + 1}. ${priorityEmoji} ${action.text} ${assigneeText}\n`;
      template += `   From: ${action.employeeName}\n\n`;
    });

    template += `Total active actions: ${activeActions.length}\nHave a productive day! 💪`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(template).then(() => {
        toast({
          title: "Success",
          description: "Template copied to clipboard!",
        });
      }).catch(() => {
        setTemplateData(template);
        toast({
          title: "Info",
          description: "Template ready below - copy manually",
        });
      });
    } else {
      setTemplateData(template);
      toast({
        title: "Info",
        description: "Template ready below - copy manually",
      });
    }
  };

  const exportAppData = () => {
    try {
      const data = {
        employees,
        meetings,
        actions,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      const dataStr = JSON.stringify(data, null, 2);
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(dataStr).then(() => {
          toast({
            title: "Success",
            description: "Export data copied to clipboard! Save as .json file",
          });
        }).catch(() => {
          setExportData(dataStr);
          toast({
            title: "Info",
            description: "Export data ready below - copy manually",
          });
        });
      } else {
        setExportData(dataStr);
        toast({
          title: "Info",
          description: "Export data ready below - copy manually",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Export failed: ${error}`,
        variant: "destructive",
      });
    }
  };

  const clearAllData = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      toast({
        title: "Warning",
        description: 'Click "CONFIRM DELETE" to permanently clear all data',
        variant: "destructive",
      });
      setTimeout(() => setClearConfirm(false), 10000);
    } else {
      // In a real app, this would call APIs to clear data
      // For now, just show a message since we're using memory storage
      setClearConfirm(false);
      toast({
        title: "Info",
        description: "Data clearing would happen here in a real implementation",
      });
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your application preferences and data
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{employees.length}</div>
                    <div className="text-sm text-blue-600">Team Members</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{meetings.length}</div>
                    <div className="text-sm text-green-600">Meetings</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{actions.length}</div>
                    <div className="text-sm text-purple-600">Total Actions</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {actions.filter(a => a.status !== 'completed').length}
                    </div>
                    <div className="text-sm text-orange-600">Active Actions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Clear All Data</h4>
                    <p className="text-sm text-gray-500">
                      Permanently delete all meetings, actions, and team members
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={clearAllData}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {clearConfirm ? 'CONFIRM DELETE' : 'Clear All Data'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Enable Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Get notified about your daily action items
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>

                <div>
                  <Label htmlFor="notification-time">Notification Time</Label>
                  <Input
                    id="notification-time"
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    className="w-32"
                  />
                </div>

                <div className="flex space-x-3">
                  <Button onClick={saveNotificationSettings}>
                    Save Settings
                  </Button>
                  <Button variant="outline" onClick={testNotification}>
                    <Bell className="w-4 h-4 mr-2" />
                    Test Notification
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Template Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Generate a daily summary of your active action items
                </p>
                <Button onClick={generateTemplate}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Template
                </Button>
                {templateData && (
                  <Textarea
                    value={templateData}
                    readOnly
                    className="font-mono text-sm min-h-[200px]"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedules" className="space-y-6">
            <NotificationSchedules 
              schedules={schedules} 
              onUpdate={() => refetchSchedules()} 
            />
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <EmailSettings />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Export all your data as a JSON file for backup or migration
                </p>
                <Button onClick={exportAppData}>
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </Button>
                {exportData && (
                  <div>
                    <Label>Export Data (Copy and save as .json file)</Label>
                    <Textarea
                      value={exportData}
                      readOnly
                      className="font-mono text-sm min-h-[300px]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Import data from a previously exported JSON file
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Import functionality would be implemented here
                  </p>
                  <Button variant="outline" disabled>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
                <div className="text-sm text-gray-500">
                  <strong>Note:</strong> Importing will replace all existing data. 
                  Make sure to export your current data first.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
