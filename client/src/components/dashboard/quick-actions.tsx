import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, UserPlus, FileDown } from "lucide-react";
import { useLocation } from "wouter";
import MeetingForm from "@/components/meetings/meeting-form";

export default function QuickActions() {
  const [, setLocation] = useLocation();
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);

  const handleExportData = () => {
    setLocation('/settings?tab=export');
  };

  const handleMeetingSuccess = () => {
    setShowMeetingDialog(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowMeetingDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Meeting
          </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setLocation('/team?new=true')}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleExportData}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </CardContent>
    </Card>

    <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Meeting</DialogTitle>
        </DialogHeader>
        <MeetingForm 
          onSuccess={handleMeetingSuccess} 
          onCancel={() => setShowMeetingDialog(false)}
        />
      </DialogContent>
    </Dialog>
    </>
  );
}
