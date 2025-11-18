import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCreateMeeting } from "@/hooks/use-meetings";
import { useEmployees } from "@/hooks/use-employees";
import { useCreateAction } from "@/hooks/use-actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, X, CheckCircle, AlertCircle } from "lucide-react";

interface DraftAction {
  id: string;
  text: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  noteExcerpt?: string;
  noteStart?: number;
  noteEnd?: number;
}

interface MeetingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MeetingForm({ onSuccess, onCancel }: MeetingFormProps) {
  const [title, setTitle] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [draftActions, setDraftActions] = useState<DraftAction[]>([]);
  const [detectedActions, setDetectedActions] = useState<string[]>([]);
  const [detectedActionsWithContext, setDetectedActionsWithContext] = useState<{text: string; excerpt: string; start: number; end: number}[]>([]);

  const createMeeting = useCreateMeeting();
  const createAction = useCreateAction();
  const { data: employees = [] } = useEmployees();
  const { user } = useAuth();
  const { toast } = useToast();

  // Detect action patterns in notes with context
  useEffect(() => {
    const actionPatterns = [
      /TODO:?\s*(.+)/gi,
      /ACTION:?\s*(.+)/gi,
      /\[ \]\s*(.+)/gi,
      /@\w+\s*(.+)/gi,
      /Follow up:?\s*(.+)/gi
    ];

    const detected: {text: string; excerpt: string; start: number; end: number}[] = [];
    for (const pattern of actionPatterns) {
      let match;
      while ((match = pattern.exec(notes)) !== null) {
        if (match[1] && match[1].trim().length > 3) {
          const actionText = match[1].trim();
          const matchStart = match.index;
          const matchEnd = match.index + match[0].length;
          
          // Create excerpt with some context around the match
          const contextStart = Math.max(0, matchStart - 20);
          const contextEnd = Math.min(notes.length, matchEnd + 20);
          const excerpt = notes.substring(contextStart, contextEnd).trim();
          
          detected.push({
            text: actionText,
            excerpt,
            start: matchStart,
            end: matchEnd
          });
        }
      }
      pattern.lastIndex = 0; // Reset regex state
    }
    
    // Remove duplicates based on text and limit to 5
    const uniqueDetected = detected.filter((item, index, arr) => 
      arr.findIndex(other => other.text === item.text) === index
    ).slice(0, 5);
    
    setDetectedActions(uniqueDetected.map(item => item.text));
    
    // Store the full context for when actions are created
    setDetectedActionsWithContext(uniqueDetected);
  }, [notes]);

  const addDraftAction = (actionText: string, fromDetection = false) => {
    let noteContext = {};
    
    if (fromDetection) {
      // Find the context for this detected action
      const contextItem = detectedActionsWithContext.find(item => item.text === actionText);
      if (contextItem) {
        noteContext = {
          noteExcerpt: contextItem.excerpt,
          noteStart: contextItem.start,
          noteEnd: contextItem.end
        };
      }
    }
    
    const newAction: DraftAction = {
      id: Date.now().toString(),
      text: actionText,
      assignee: "me",
      priority: 'medium',
      ...noteContext
    };
    
    setDraftActions(prev => [...prev, newAction]);
    
    if (fromDetection) {
      // Remove from detected actions when added
      setDetectedActions(prev => prev.filter(action => action !== actionText));
    }
  };

  const removeDraftAction = (id: string) => {
    setDraftActions(prev => prev.filter(action => action.id !== id));
  };

  const updateDraftAction = (id: string, field: keyof DraftAction, value: string) => {
    setDraftActions(prev => prev.map(action => 
      action.id === id ? { ...action, [field]: value } : action
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId || !date || !notes) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const employee = employees.find(emp => emp.id === parseInt(employeeId));
    if (!employee) {
      toast({
        title: "Error",
        description: "Please select a valid team member",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the meeting first
      const meeting = await createMeeting.mutateAsync({
        title: title || undefined,
        employeeId: parseInt(employeeId),
        employeeName: employee.name,
        date,
        notes,
        emailRecipient: emailRecipient || undefined,
        userId: (user as any)?.claims?.sub || '',
      });

      // Create all draft actions linked to the meeting
      for (const draftAction of draftActions) {
        await createAction.mutateAsync({
          text: draftAction.text,
          assignee: draftAction.assignee,
          priority: draftAction.priority,
          status: 'pending',
          meetingId: meeting.id,
          employeeName: employee.name,
          userId: (user as any)?.claims?.sub || '',
          // Include note context if available
          noteExcerpt: draftAction.noteExcerpt,
          noteStart: draftAction.noteStart,
          noteEnd: draftAction.noteEnd,
        });
      }

      toast({
        title: "Success",
        description: `Meeting saved${draftActions.length > 0 ? ` with ${draftActions.length} action items` : ''}!`,
      });

      // Reset form
      setTitle("");
      setEmployeeId("");
      setDate(new Date().toISOString().split('T')[0]);
      setNotes("");
      setEmailRecipient("");
      setDraftActions([]);
      setDetectedActions([]);
      
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create meeting",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Meeting</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Meeting Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q1 Planning Session"
            />
          </div>

          <div>
            <Label htmlFor="employee">Team Member *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="emailRecipient">Email Summary To (Optional)</Label>
            <Input
              id="emailRecipient"
              type="email"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              placeholder="colleague@company.com"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Send meeting notes to this email address when saved
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Meeting Notes *</Label>
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              💡 <strong>Smart Action Detection:</strong><br/>
              • Type <strong>TODO:</strong> or <strong>ACTION:</strong> to create action items<br/>
              • Use <strong>[ ]</strong> for checkboxes<br/>
              • <strong>@username</strong> for assignments<br/>
              • Actions will be auto-detected and you can convert them instantly!
            </div>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter meeting notes... Try typing 'TODO: Review budget' or 'ACTION: Send report'"
              className="font-mono text-sm min-h-[160px]"
            />
            
            {/* Detected Actions */}
            {detectedActions.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">Detected Action Items:</span>
                </div>
                <div className="space-y-2">
                  {detectedActions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-green-700 flex-1">{action}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addDraftAction(action, true)}
                        className="ml-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Draft Actions */}
          {draftActions.length > 0 && (
            <div>
              <Label>Action Items ({draftActions.length})</Label>
              <div className="space-y-3 mt-2">
                {draftActions.map((action) => (
                  <div key={action.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <Input
                        value={action.text}
                        onChange={(e) => updateDraftAction(action.id, 'text', e.target.value)}
                        placeholder="Action description"
                        className="flex-1 mr-2"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeDraftAction(action.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex space-x-2">
                      <Select 
                        value={action.assignee} 
                        onValueChange={(value) => updateDraftAction(action.id, 'assignee', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="me">Me</SelectItem>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.name}>
                              {emp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select 
                        value={action.priority} 
                        onValueChange={(value) => updateDraftAction(action.id, 'priority', value as 'low' | 'medium' | 'high')}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addDraftAction("")}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Another Action
              </Button>
            </div>
          )}

          {draftActions.length === 0 && detectedActions.length === 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addDraftAction("")}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Action Item
            </Button>
          )}

          <div className="flex space-x-3">
            <Button type="submit" disabled={createMeeting.isPending || createAction.isPending}>
              {(createMeeting.isPending || createAction.isPending) ? "Saving..." : 
               `Save Meeting${draftActions.length > 0 ? ` + ${draftActions.length} Actions` : ''}`}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          
          {draftActions.length > 0 && (
            <div className="flex items-center text-sm text-gray-600 mt-2">
              <AlertCircle className="h-4 w-4 mr-1" />
              {draftActions.length} action item{draftActions.length !== 1 ? 's' : ''} will be created with this meeting
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
