import { useState } from "react";
import { AchievementBadge } from "./achievement-badge";
import { AchievementWithStatus, useMarkAchievementViewed, getAchievementsByCategory } from "@/hooks/use-achievements";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AchievementCategory } from "@shared/schema";
import { Filter, Trophy } from "lucide-react";

interface AchievementGridProps {
  achievements: AchievementWithStatus[];
  showFilters?: boolean;
}

export function AchievementGrid({ achievements, showFilters = true }: AchievementGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showUnlockedOnly, setShowUnlockedOnly] = useState<boolean>(false);
  const markViewed = useMarkAchievementViewed();

  // Filter achievements based on selected filters
  const filteredAchievements = achievements.filter(achievement => {
    const categoryMatch = selectedCategory === "all" || achievement.category === selectedCategory;
    const unlockedMatch = !showUnlockedOnly || achievement.unlocked;
    return categoryMatch && unlockedMatch;
  });

  const handleMarkViewed = (userAchievementId: number) => {
    markViewed.mutate(userAchievementId);
  };

  const categories = [
    { value: "all", label: "All", count: achievements.length },
    { value: AchievementCategory.MEETINGS, label: "Meetings", count: getAchievementsByCategory(achievements, AchievementCategory.MEETINGS).length },
    { value: AchievementCategory.ACTIONS, label: "Actions", count: getAchievementsByCategory(achievements, AchievementCategory.ACTIONS).length },
    { value: AchievementCategory.PRODUCTIVITY, label: "Productivity", count: getAchievementsByCategory(achievements, AchievementCategory.PRODUCTIVITY).length },
    { value: AchievementCategory.SOCIAL, label: "Social", count: getAchievementsByCategory(achievements, AchievementCategory.SOCIAL).length },
    { value: AchievementCategory.MILESTONES, label: "Milestones", count: getAchievementsByCategory(achievements, AchievementCategory.MILESTONES).length },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="text-lg font-semibold">Achievements</span>
          </div>
          <Badge variant="secondary">
            {unlockedCount}/{totalCount} Unlocked
          </Badge>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                data-testid={`filter-category-${category.value}`}
              >
                {category.label} ({category.count})
              </Button>
            ))}
          </div>

          {/* Unlocked Only Filter */}
          <div className="flex items-center space-x-2">
            <Button
              variant={showUnlockedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
              data-testid="filter-unlocked-only"
            >
              Show Unlocked Only
            </Button>
          </div>
        </div>
      )}

      {/* Achievement Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Achievements Found</h3>
          <p className="text-gray-500">
            {showUnlockedOnly ? "You haven't unlocked any achievements in this category yet." : "No achievements match your current filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAchievements.map(achievement => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              onMarkViewed={handleMarkViewed}
              size="medium"
            />
          ))}
        </div>
      )}
    </div>
  );
}