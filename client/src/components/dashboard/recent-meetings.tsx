import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMeetings } from "@/hooks/use-meetings";
import { useLocation } from "wouter";

export default function RecentMeetings() {
  const { data: meetings = [] } = useMeetings();
  const [, setLocation] = useLocation();

  const recentMeetings = meetings
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Meetings</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-gray-200">
        {recentMeetings.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No meetings found
          </div>
        ) : (
          recentMeetings.map((meeting) => (
            <div 
              key={meeting.id} 
              className="p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setLocation(`/meetings?highlight=${meeting.id}`)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-medium">
                      {getInitials(meeting.employeeName)}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {meeting.title || `Meeting with ${meeting.employeeName}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {meeting.employeeName} • {formatDate(meeting.date)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div className="px-6 py-3 border-t border-gray-200">
          <Button 
            variant="ghost" 
            className="w-full text-center"
            onClick={() => setLocation('/meetings')}
          >
            View All Meetings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
