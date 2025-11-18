import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AchievementWithStatus, useMarkAchievementViewed } from "@/hooks/use-achievements";
import { X, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementNotificationProps {
  achievements: AchievementWithStatus[];
  onDismiss?: () => void;
  className?: string;
}

export function AchievementNotification({ achievements, onDismiss, className }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const markViewed = useMarkAchievementViewed();
  
  const newAchievements = achievements.filter(a => a.unlocked && !a.isViewed);
  
  useEffect(() => {
    if (newAchievements.length > 0) {
      setIsVisible(true);
    }
  }, [newAchievements.length]);

  if (newAchievements.length === 0 || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    // Mark all as viewed
    newAchievements.forEach(achievement => {
      if (achievement.userAchievementId) {
        markViewed.mutate(achievement.userAchievementId);
      }
    });
    setIsVisible(false);
    onDismiss?.();
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50 shadow-lg';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <Card className={cn(
      "relative animate-in slide-in-from-right duration-500 border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-yellow-800" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                New Achievement{newAchievements.length > 1 ? 's' : ''} Unlocked!
                <Star className="h-4 w-4 ml-2 text-yellow-500" />
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                You've earned {newAchievements.length} new badge{newAchievements.length > 1 ? 's' : ''}!
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
            data-testid="button-dismiss-achievements"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Achievement Preview */}
        <div className="mt-4 space-y-3">
          {newAchievements.slice(0, 2).map(achievement => (
            <div 
              key={achievement.id}
              className={cn(
                "flex items-center space-x-3 p-2 rounded-lg",
                getRarityColor(achievement.rarity)
              )}
            >
              <div className="flex-shrink-0 text-2xl">
                {achievement.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{achievement.name}</p>
                <p className="text-xs text-gray-600">{achievement.description}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {achievement.rarity}
              </Badge>
            </div>
          ))}
          
          {newAchievements.length > 2 && (
            <div className="text-center text-sm text-gray-500">
              +{newAchievements.length - 2} more achievement{newAchievements.length - 2 > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            data-testid="button-mark-all-viewed"
          >
            Mark All Viewed
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => window.location.href = "/achievements"}
            data-testid="button-view-all-achievements"
          >
            View All Achievements
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}