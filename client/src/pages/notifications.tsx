import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Bell, MessageCircle, TestTube, ExternalLink, Copy, Check, Calendar } from "lucide-react";
import { legacyApiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@shared/schema";

export default function Notifications() {
  const { toast } = useToast();
  const { user } = useAuth() as { user: User | undefined };
  const [chatId, setChatId] = useState(user?.telegramChatId || '');
  const [enabled, setEnabled] = useState(user?.notificationsEnabled || false);
  const [copied, setCopied] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (data: { chatId: string; enabled: boolean }) => {
      await legacyApiRequest('/api/notifications/telegram', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Success",
        description: "Notification settings updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      await legacyApiRequest('/api/notifications/test', 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Test Sent!",
        description: "Check your Telegram for the test notification.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send test notification. Make sure your Chat ID is correct and you've started the bot.",
        variant: "destructive",
      });
    },
  });

  const testDailyMutation = useMutation({
    mutationFn: async () => {
      await legacyApiRequest('/api/notifications/test-daily', 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Daily Test Sent!",
        description: "Check your Telegram for the full daily notification format.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send test daily notification. Make sure your Chat ID is correct and you've started the bot.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (enabled && !chatId.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Telegram Chat ID to enable notifications",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({ chatId: chatId.trim(), enabled });
  };

  const copyBotLink = async () => {
    const botLink = "https://t.me/Guybnitify_bot";
    try {
      await navigator.clipboard.writeText(botLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Bot link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-gray-600">Configure how you receive daily meeting updates and reminders.</p>
      </div>

      {/* Telegram Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="mr-2 h-5 w-5 text-blue-500" />
            Telegram Notifications
          </CardTitle>
          <CardDescription>
            Get daily summaries of your meetings and action items sent directly to your Telegram.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Setup Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Setup Instructions:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Start a chat with our Telegram bot</li>
              <li>Send the command <code className="bg-blue-100 px-1 rounded">/start</code></li>
              <li>Copy the Chat ID provided by the bot</li>
              <li>Paste it below and enable notifications</li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={copyBotLink}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Bot Link
                </>
              )}
            </Button>
          </div>

          {/* Settings Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Telegram Notifications</Label>
                <div className="text-sm text-gray-600">
                  Receive daily meeting summaries at 9:00 AM
                </div>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            {enabled && (
              <div className="space-y-2">
                <Label htmlFor="chatId">Telegram Chat ID</Label>
                <Input
                  id="chatId"
                  placeholder="Enter your Telegram Chat ID"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                />
                <p className="text-sm text-gray-600">
                  Get this ID by starting the bot and sending /start
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
            
            {enabled && chatId && (
              <>
                <Button
                  variant="outline"
                  onClick={() => testMutation.mutate()}
                  disabled={testMutation.isPending}
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  {testMutation.isPending ? 'Sending...' : 'Simple Test'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testDailyMutation.mutate()}
                  disabled={testDailyMutation.isPending}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {testDailyMutation.isPending ? 'Sending...' : 'Daily Format Test'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5 text-orange-500" />
            Notification Schedule
          </CardTitle>
          <CardDescription>
            When you'll receive your meeting updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <div className="font-medium">Daily Summary</div>
                <div className="text-sm text-gray-600">Overview of today's meetings and pending actions</div>
              </div>
              <div className="text-sm font-medium text-gray-900">9:00 AM</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}