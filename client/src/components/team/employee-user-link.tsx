import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { legacyApiRequest, queryClient } from "@/lib/queryClient";
import { User, Employee } from "@shared/schema";
import { Link, Unlink } from "lucide-react";

interface EmployeeUserLinkProps {
  employee: Employee;
}

export default function EmployeeUserLink({ employee }: EmployeeUserLinkProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const { toast } = useToast();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    retry: false,
  });

  const linkMutation = useMutation({
    mutationFn: async (linkedUserId: string) => {
      await legacyApiRequest(`/api/admin/employees/${employee.id}/link`, 'POST', { linkedUserId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "Team member linked to user successfully!",
      });
      setSelectedUserId("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to link team member to user",
        variant: "destructive",
      });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      await legacyApiRequest(`/api/admin/employees/${employee.id}/link`, 'POST', { linkedUserId: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "Team member unlinked from user successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to unlink team member from user",
        variant: "destructive",
      });
    },
  });

  const linkedUser = users.find(u => u.id === employee.linkedUserId);
  const availableUsers = users.filter(u => u.isApproved);

  return (
    <div className="flex items-center gap-2 mt-2">
      {employee.linkedUserId ? (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Link className="h-3 w-3" />
            {linkedUser ? `${linkedUser.firstName || 'User'} ${linkedUser.lastName || ''} (${linkedUser.email})` : `User ID: ${employee.linkedUserId} (Not loaded)`}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => unlinkMutation.mutate()}
            disabled={unlinkMutation.isPending}
          >
            <Unlink className="h-3 w-3 mr-1" />
            Unlink
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Link to system user..." />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.firstName || 'User'} {user.lastName || ''} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => linkMutation.mutate(selectedUserId)}
            disabled={!selectedUserId || linkMutation.isPending}
          >
            <Link className="h-3 w-3 mr-1" />
            Link
          </Button>
        </div>
      )}
    </div>
  );
}