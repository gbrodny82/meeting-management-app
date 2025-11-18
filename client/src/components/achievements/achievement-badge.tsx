import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AchievementWithStatus } from "@/hooks/use-achievements";
import { Eye, Lock } from "lucide-react";

interface AchievementBadgeProps {
  achievement: AchievementWithStatus;
  onMarkViewed?: (userAchievementId: number) => void;
  size?: "small" | "medium" | "large";
}

export function AchievementBadge({ achievement, onMarkViewed, size = "medium" }: AchievementBadgeProps) {
  const sizeClasses = {
    small: "h-16 w-16 text-xs",
    medium: "h-20 w-20 text-sm", 
    large: "h-24 w-24 text-base"
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50 shadow-md';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityBadgeColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card 
      className={cn(
        "relative transition-all duration-200 hover:scale-105",
        achievement.unlocked ? getRarityColor(achievement.rarity) : "border-gray-200 bg-gray-100",
        !achievement.unlocked && "opacity-60"
      )}
      data-testid={`achievement-badge-${achievement.badgeId}`}
    >
      <CardContent className="p-4 text-center">
        {/* Achievement Icon/Emoji */}
        <div 
          className={cn(
            "mx-auto mb-2 flex items-center justify-center rounded-full border-2",
            sizeClasses[size],
            achievement.unlocked ? getRarityColor(achievement.rarity) : "border-gray-300 bg-gray-200"
          )}
        >
          {achievement.unlocked ? (
            <span className="text-2xl">{achievement.icon}</span>
          ) : (
            <Lock className="h-6 w-6 text-gray-400" />
          )}
        </div>

        {/* Achievement Name */}
        <h3 className={cn(
          "font-semibold",
          achievement.unlocked ? "text-gray-900" : "text-gray-500",
          size === "small" ? "text-xs" : "text-sm"
        )}>
          {achievement.name}
        </h3>

        {/* Achievement Description */}
        <p className={cn(
          "mt-1 text-xs",
          achievement.unlocked ? "text-gray-600" : "text-gray-400"
        )}>
          {achievement.description}
        </p>

        {/* Rarity Badge */}
        <Badge 
          className={cn(
            "mt-2 text-xs",
            getRarityBadgeColor(achievement.rarity)
          )}
          variant="secondary"
        >
          {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
        </Badge>

        {/* Unlocked Date */}
        {achievement.unlocked && achievement.unlockedAt && (
          <div className="mt-2 text-xs text-gray-500">
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </div>
        )}

        {/* New Badge Indicator */}
        {achievement.unlocked && !achievement.isViewed && (
          <div className="absolute -right-2 -top-2">
            <Badge className="bg-red-500 text-white">New!</Badge>
          </div>
        )}

        {/* Mark as Viewed Button */}
        {achievement.unlocked && !achievement.isViewed && achievement.userAchievementId && onMarkViewed && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2 text-xs"
            onClick={() => onMarkViewed(achievement.userAchievementId!)}
            data-testid={`button-mark-viewed-${achievement.badgeId}`}
          >
            <Eye className="h-3 w-3 mr-1" />
            Mark Viewed
          </Button>
        )}
      </CardContent>
    </Card>
  );
}