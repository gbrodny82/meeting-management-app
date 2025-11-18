import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import MeetingForm from "@/components/meetings/meeting-form";
import MeetingCard from "@/components/meetings/meeting-card";
import { useMeetings } from "@/hooks/use-meetings";
import { useEmployees } from "@/hooks/use-employees";
import { useAppContext } from "@/contexts/app-context";
import { Plus, Search, Calendar, ArrowLeft } from "lucide-react";

export default function Meetings() {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/meetings/:id");
  const { data: meetings = [], isLoading } = useMeetings();
  const { data: employees = [] } = useEmployees();
  const { searchTerm, setSearchTerm } = useAppContext();
  
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  // Check URL params for new meeting form
  useEffect(() => {
    if (isLoading || meetings.length === 0) return;
    
    const params = new URLSearchParams(location.split('?')[1] || '');
    const isNew = params.get('new') === 'true';
    
    if (isNew) {
      setShowNewMeeting(true);
    }
  }, [location, meetings, isLoading]);

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = searchTerm === '' || 
      meeting.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmployee = filterEmployee === 'all' || meeting.employeeName === filterEmployee;
    const matchesDateFrom = filterDateFrom === '' || meeting.date >= filterDateFrom;
    const matchesDateTo = filterDateTo === '' || meeting.date <= filterDateTo;
    return matchesSearch && matchesEmployee && matchesDateFrom && matchesDateTo;
  }).sort((a, b) => {
    // Sort by date descending (newest first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEmployee('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const setQuickDateFilter = (type: 'week' | 'month') => {
    const today = new Date();
    let startDate: Date;
    
    if (type === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    setFilterDateFrom(startDate.toISOString().split('T')[0]);
    setFilterDateTo(today.toISOString().split('T')[0]);
  };

  const handleNewMeetingSuccess = () => {
    setShowNewMeeting(false);
    setLocation('/meetings');
  };

  const handleCancelNewMeeting = () => {
    setShowNewMeeting(false);
    setLocation('/meetings');
  };

  // Check if we're viewing a single meeting
  const meetingId = params?.id ? parseInt(params.id) : null;
  const singleMeeting = meetingId ? meetings.find(m => m.id === meetingId) : null;
  
  // Get action ID from query params for highlighting
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const actionIdFromUrl = urlParams.get('action');
  const actionId = actionIdFromUrl ? parseInt(actionIdFromUrl) : null;

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Single meeting detail view
  if (meetingId && singleMeeting) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/meetings')}
              data-testid="button-back-to-meetings"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Meetings
            </Button>
          </div>
          
          <MeetingCard 
            meeting={singleMeeting}
            isHighlighted={true}
            highlightedActionId={actionId}
          />
        </div>
      </div>
    );
  }
  
  // Handle case where meeting ID is provided but not found
  if (meetingId && !singleMeeting && !isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/meetings')}
              data-testid="button-back-to-meetings"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Meetings
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Meeting not found</h3>
              <p className="text-gray-500">
                The meeting you're looking for doesn't exist or has been deleted.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Meetings
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage meeting notes and action items
            </p>
          </div>
          <Button onClick={() => setShowNewMeeting(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Meeting
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search meetings and notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Team Members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Members</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-40"
                placeholder="From date"
              />
              <span className="self-center text-gray-500 text-sm">to</span>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-40"
                placeholder="To date"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateFilter('week')}
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateFilter('month')}
              >
                This Month
              </Button>
              
              {(searchTerm || filterEmployee !== 'all' || filterDateFrom || filterDateTo) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {filteredMeetings.length} of {meetings.length} meetings
            </div>
          </CardContent>
        </Card>

        {/* Add Meeting Form */}
        {showNewMeeting && (
          <MeetingForm 
            onSuccess={handleNewMeetingSuccess}
            onCancel={handleCancelNewMeeting}
          />
        )}

        {/* Meetings List */}
        {filteredMeetings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No meetings found</h3>
              <p className="text-gray-500 mb-4">
                {meetings.length === 0 
                  ? "No meetings have been created yet." 
                  : "No meetings match your current filters."}
              </p>
              {meetings.length > 0 && (
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMeetings.map(meeting => (
              <MeetingCard 
                key={meeting.id}
                meeting={meeting}
                isHighlighted={false}
                highlightedActionId={null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
