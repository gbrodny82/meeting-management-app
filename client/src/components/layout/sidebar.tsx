import { Link, useLocation } from "wouter";
import { 
  ClipboardList, 
  BarChart3, 
  CheckSquare, 
  Calendar, 
  Users, 
  Settings,
  Shield,
  Bell,
  Trophy
} from "lucide-react";
import { useStats } from "@/hooks/use-actions";
import { useAuth } from "@/hooks/useAuth";
import { useUserAchievements, getNewAchievementsCount } from "@/hooks/use-achievements";
import { User } from "@shared/schema";

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Action Items', href: '/actions', icon: CheckSquare },
  { name: 'Meetings', href: '/meetings', icon: Calendar },
  { name: 'Team Members', href: '/team', icon: Users },
  { name: 'Achievements', href: '/achievements', icon: Trophy },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { data: stats } = useStats();
  const { user } = useAuth() as { user: User | undefined };
  const { data: achievements = [] } = useUserAchievements();
  
  const isAdmin = user?.role === 'admin';
  const newAchievementCount = getNewAchievementsCount(achievements);

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
        {/* Logo/Brand */}
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <ClipboardList className="text-white" size={16} />
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900">MeetingTracker</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <div className={`sidebar-nav-item cursor-pointer ${
                  isActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'
                }`}>
                  <item.icon className={`mr-3 flex-shrink-0 h-4 w-4 ${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {item.name}
                  {item.name === 'Achievements' && newAchievementCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.5rem] h-6 flex items-center justify-center">
                      {newAchievementCount}
                    </span>
                  )}
                  {item.name === 'Action Items' && stats && (
                    <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {stats.activeActions}
                    </span>
                  )}
                  {item.name === 'Meetings' && stats && (
                    <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {stats.totalMeetings}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Settings & Admin */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 space-y-1">
          {isAdmin && (
            <Link href="/admin">
              <div className={`sidebar-nav-item cursor-pointer ${
                location === '/admin' ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'
              }`}>
                <Shield className={`mr-3 flex-shrink-0 h-4 w-4 ${
                  location === '/admin' ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                Admin Panel
              </div>
            </Link>
          )}
          <Link href="/notifications">
            <div className={`sidebar-nav-item cursor-pointer ${
              location === '/notifications' ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'
            }`}>
              <Bell className={`mr-3 flex-shrink-0 h-4 w-4 ${
                location === '/notifications' ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              Notifications
            </div>
          </Link>
          <Link href="/settings">
            <div className={`sidebar-nav-item cursor-pointer ${
              location === '/settings' ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'
            }`}>
              <Settings className={`mr-3 flex-shrink-0 h-4 w-4 ${
                location === '/settings' ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              Settings
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
