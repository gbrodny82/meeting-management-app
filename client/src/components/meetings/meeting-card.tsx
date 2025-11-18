import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateMeeting, useDeleteMeeting } from "@/hooks/use-meetings";
import { useActions } from "@/hooks/use-actions";
import { useToast } from "@/hooks/use-toast";
import { Meeting } from "@shared/schema";
import { formatMarkdownToJSX, renderMarkdownLine, injectHighlightMarkers } from "@/lib/markdown";
import ActionItem from "../actions/action-item";
import AddActionForm from "../actions/add-action-form";
import MeetingInsights from "../insights/meeting-insights";
import { Plus, Trash2, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface MeetingCardProps {
  meeting: Meeting;
  isHighlighted?: boolean;
  highlightedActionId?: number | null;
}

export default function MeetingCard({ meeting, isHighlighted, highlightedActionId }: MeetingCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);
  const [notes, setNotes] = useState(meeting.notes);
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const { data: actions = [], isLoading: actionsLoading } = useActions();
  const { toast } = useToast();
  const notesRef = useRef<HTMLDivElement>(null);

  const meetingActions = actions.filter(action => action.meetingId === meeting.id);
  
  // Find the highlighted action and prepare notes with highlighting
  const highlightedAction = highlightedActionId ? actions.find(a => a.id === highlightedActionId) : null;
  const notesForDisplay = highlightedAction?.noteExcerpt 
    ? injectHighlightMarkers(meeting.notes, highlightedAction.noteExcerpt)
    : meeting.notes;
  
  const formattedNotes = formatMarkdownToJSX(notesForDisplay);

  // Scroll to highlighted text when highlighted action changes
  useEffect(() => {
    if (highlightedActionId && notesRef.current && !actionsLoading) {
      setTimeout(() => {
        const highlightedElement = notesRef.current?.querySelector('.scroll-target');
        if (highlightedElement) {
          highlightedElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 500);
    }
  }, [highlightedActionId, actionsLoading]);

  const handleSaveNotes = async () => {
    try {
      await updateMeeting.mutateAsync({
        id: meeting.id,
        updates: { notes }
      });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Meeting notes updated!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update meeting notes",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setNotes(meeting.notes);
    setIsEditing(false);
  };

  const handleActionSuccess = () => {
    setShowAddAction(false);
  };

  const handleCancelAddAction = () => {
    setShowAddAction(false);
  };

  const handleDeleteMeeting = async () => {
    try {
      await deleteMeeting.mutateAsync(meeting.id);
      toast({
        title: "Success",
        description: "Meeting deleted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete meeting",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`${isHighlighted ? 'border-2 border-blue-500 bg-blue-50' : ''}`}>
      <CardContent className="p-6">
        {isHighlighted && (
          <div className="mb-4 p-2 bg-blue-100 border border-blue-300 rounded text-sm text-blue-800">
            🎯 <strong>Navigated from task</strong> - This meeting contains the action item context
          </div>
        )}
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {meeting.title || `Meeting with ${meeting.employeeName}`}
            </h3>
            <p className="text-gray-500">{new Date(meeting.date).toLocaleDateString()}</p>
            <p className="text-sm text-gray-600">{meeting.employeeName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Notes'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Meeting
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this meeting? This action cannot be undone and will also delete any associated action items.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteMeeting}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteMeeting.isPending}
                      >
                        {deleteMeeting.isPending ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium mb-2">Notes:</h4>
          {isEditing ? (
            <div className="space-y-3">
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                💡 <strong>Formatting Tips:</strong><br/>
                • <strong># Heading</strong> for main sections<br/>
                • <strong>## Subheading</strong> for subsections<br/>
                • <strong>**Bold text**</strong> for emphasis<br/>
                • <strong>- Item</strong> for bullet points
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="font-mono text-sm min-h-[160px]"
                placeholder="Enter meeting notes with formatting..."
              />
              <div className="flex space-x-2">
                <Button onClick={handleSaveNotes} disabled={updateMeeting.isPending}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div ref={notesRef} className="space-y-1">
              {formattedNotes.length > 0 ? (
                formattedNotes.map(renderMarkdownLine)
              ) : (
                <div className="text-gray-700 whitespace-pre-wrap">{meeting.notes}</div>
              )}
            </div>
          )}
        </div>

        {/* Action Items Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Action Items ({meetingActions.length})</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddAction(!showAddAction)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Action
            </Button>
          </div>
          
          {meetingActions.length > 0 && (
            <div className="space-y-2 mb-4">
              {meetingActions.map((action) => (
                <ActionItem key={action.id} action={action} />
              ))}
            </div>
          )}

          {showAddAction && (
            <AddActionForm
              meetingId={meeting.id}
              employeeName={meeting.employeeName}
              onSuccess={handleActionSuccess}
              onCancel={handleCancelAddAction}
            />
          )}

          {meetingActions.length === 0 && !showAddAction && (
            <div className="text-sm text-gray-500 py-2">
              No action items yet. Click "Add Action" to create one.
            </div>
          )}
        </div>

        {/* AI Meeting Insights */}
        <MeetingInsights 
          meetingId={meeting.id} 
          meetingTitle={meeting.title || `Meeting with ${meeting.employeeName}`}
        />
      </CardContent>
    </Card>
  );
}
