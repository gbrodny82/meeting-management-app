import { Search, Bell, Menu, X, Clock, AlertCircle } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Action, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function TopBar() {
  const { searchTerm, setSearchTerm } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [, setLocation] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth() as { user: User | undefined };

  // Always fetch actions to show count
  const { data: actions = [] } = useQuery<Action[]>({
    queryKey: ['/api/actions'],
  });

  const pendingActions = actions.filter(action => action.status === 'pending');
  const highPriorityActions = actions.filter(action => action.priority === 'high' && action.status !== 'completed');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
      <button className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden">
        <Menu size={20} />
      </button>
      
      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <div className="relative w-full text-gray-400 focus-within:text-gray-600">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <Search size={16} />
              </div>
              <input
                className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent"
                placeholder="Search meetings, actions, or team members..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6 space-x-3">
          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
            >
              <Bell size={20} />
              {(pendingActions.length > 0 || highPriorityActions.length > 0) && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {Math.max(pendingActions.length, highPriorityActions.length)}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Action Items</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {actions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Bell size={24} className="mx-auto mb-2 text-gray-300" />
                      <p>No action items found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {/* High Priority Actions */}
                      {highPriorityActions.length > 0 && (
                        <div className="p-3 bg-red-50">
                          <div className="flex items-center mb-2">
                            <AlertCircle size={16} className="text-red-500 mr-2" />
                            <span className="text-sm font-medium text-red-700">High Priority</span>
                          </div>
                          {highPriorityActions.slice(0, 3).map((action) => (
                            <div key={action.id} className="mb-2 last:mb-0">
                              <p className="text-sm text-gray-900 truncate">{action.text}</p>
                              <p className="text-xs text-gray-500">Assigned to: {action.assignee}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Pending Actions */}
                      {pendingActions.length > 0 && (
                        <div className="p-3">
                          <div className="flex items-center mb-2">
                            <Clock size={16} className="text-blue-500 mr-2" />
                            <span className="text-sm font-medium text-blue-700">Pending Actions</span>
                          </div>
                          {pendingActions.slice(0, 5).map((action) => (
                            <div key={action.id} className="mb-2 last:mb-0">
                              <p className="text-sm text-gray-900 truncate">{action.text}</p>
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-500">Assigned to: {action.assignee}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  action.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {action.priority}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Other Actions */}
                      {actions.filter(a => a.status !== 'pending' && (a.priority !== 'high' || a.status === 'completed')).length > 0 && (
                        <div className="p-3">
                          <span className="text-sm font-medium text-gray-700 mb-2 block">Other Actions</span>
                          {actions.filter(a => a.status !== 'pending' && (a.priority !== 'high' || a.status === 'completed')).slice(0, 3).map((action) => (
                            <div key={action.id} className="mb-2 last:mb-0">
                              <p className="text-sm text-gray-700 truncate">{action.text}</p>
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-500">Assigned to: {action.assignee}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  action.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  action.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {action.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {actions.length > 0 && (
                  <div className="p-3 border-t border-gray-200 text-center">
                    <button 
                      onClick={() => {
                        setShowNotifications(false);
                        setLocation('/actions');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                    >
                      View all action items
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Profile */}
          <div className="relative">
            <button 
              onClick={() => window.location.href = '/api/logout'}
              className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:bg-gray-50"
              title="Click to sign out"
            >
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="hidden md:block ml-2 text-gray-700 text-sm font-medium">
                {user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : user?.email || 'User'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
