import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Mail, TestTube, Eye, EyeOff } from 'lucide-react';

interface User {
  id: string;
  email: string | null;
  emailSenderAddress: string | null;
  emailSenderPassword: string | null;
  emailEnabled: boolean | null;
}

export function EmailSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  const [formData, setFormData] = useState({
    senderEmail: user?.emailSenderAddress || '',
    senderPassword: user?.emailSenderPassword || '',
    enabled: user?.emailEnabled || false,
  });

  const updateEmailSettings = useMutation({
    mutationFn: async (data: { senderEmail: string; senderPassword: string; enabled: boolean }) => {
      const response = await fetch('/api/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Email settings updated",
        description: "Your email configuration has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update email settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testEmail = useMutation({
    mutationFn: async (testRecipient: string) => {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testRecipient }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: "Check your inbox to verify the email configuration is working.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send test email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmailSettings.mutate(formData);
  };

  const handleTestEmail = () => {
    if (!formData.senderEmail) {
      toast({
        title: "Email address required",
        description: "Please configure your email address first.",
        variant: "destructive",
      });
      return;
    }
    testEmail.mutate(formData.senderEmail);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Configuration
        </CardTitle>
        <CardDescription>
          Configure Gmail settings to send meeting notes via email. You'll need to create an App Password in your Google Account settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senderEmail">Gmail Address</Label>
              <Input
                id="senderEmail"
                type="email"
                placeholder="your-email@gmail.com"
                value={formData.senderEmail}
                onChange={(e) =>
                  setFormData({ ...formData, senderEmail: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderPassword">Gmail App Password</Label>
              <div className="relative">
                <Input
                  id="senderPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="16-character app password"
                  value={formData.senderPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, senderPassword: e.target.value })
                  }
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate an App Password in your{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Account settings
                </a>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="emailEnabled"
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
              <Label htmlFor="emailEnabled">Enable email functionality</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={updateEmailSettings.isPending}
            >
              {updateEmailSettings.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Settings
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleTestEmail}
              disabled={testEmail.isPending || !formData.senderEmail}
            >
              {testEmail.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="mr-2 h-4 w-4" />
              )}
              Test Email
            </Button>
          </div>

          {formData.enabled && (
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                How to set up Gmail App Password:
              </h4>
              <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>Go to your Google Account settings</li>
                <li>Enable 2-Factor Authentication if not already enabled</li>
                <li>Go to Security → App passwords</li>
                <li>Generate a new app password for "Meeting Tracker"</li>
                <li>Copy the 16-character password and paste it above</li>
              </ol>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}