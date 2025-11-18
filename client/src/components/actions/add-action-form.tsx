import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateAction } from "@/hooks/use-actions";
import { useEmployees } from "@/hooks/use-employees";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { insertActionSchema, ActionStatus, ActionPriority } from "@shared/schema";
import { X } from "lucide-react";

interface AddActionFormProps {
  meetingId: number;
  employeeName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const formSchema = insertActionSchema.extend({
  text: z.string().min(1, "Action description is required"),
  assignee: z.string().min(1, "Assignee is required"),
  priority: z.string().min(1, "Priority is required"),
}).omit({ userId: true });

export default function AddActionForm({ meetingId, employeeName, onSuccess, onCancel }: AddActionFormProps) {
  const createAction = useCreateAction();
  const { data: employees = [] } = useEmployees();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      assignee: "",
      status: ActionStatus.PENDING,
      priority: ActionPriority.MEDIUM,
      meetingId,
      employeeName,
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('Form submission started:', values);
    console.log('User data:', user);
    
    try {
      const actionData = {
        ...values,
        userId: (user as any)?.id || (user as any)?.email || 'unknown',
      };
      
      console.log('Submitting action:', actionData);
      
      await createAction.mutateAsync(actionData);
      
      toast({
        title: "Success",
        description: "Action item created successfully!",
      });
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Action creation failed:', error);
      toast({
        title: "Error",
        description: "Failed to create action item",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Add Action Item</CardTitle>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the action item..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assignee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="me">Me</SelectItem>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.name}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ActionPriority.LOW}>Low</SelectItem>
                        <SelectItem value={ActionPriority.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={ActionPriority.HIGH}>High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <Button 
                type="submit" 
                disabled={createAction.isPending}
                onClick={(e) => {
                  console.log('Add Action button clicked');
                  // Form validation and submission will be handled automatically
                }}
              >
                {createAction.isPending ? "Creating..." : "Add Action"}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}