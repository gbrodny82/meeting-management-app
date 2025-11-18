import { useUserAchievements, getAchievementProgress, getNewAchievementsCount } from "@/hooks/use-achievements";
import { AchievementGrid } from "@/components/achievements/achievement-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Star, Zap } from "lucide-react";

export function AchievementsPage() {
  const { data: achievements = [], isLoading, error } = useUserAchievements();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-gray-500">Loading achievements...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Failed to load achievements. Please try again.</div>
        </div>
      </div>
    );
  }

  const progress = getAchievementProgress(achievements);
  const newCount = getNewAchievementsCount(achievements);
  
  // Achievement statistics by category
  const categories = ['meetings', 'actions', 'productivity', 'social', 'milestones'];
  const categoryStats = categories.map(category => {
    const categoryAchievements = achievements.filter(a => a.category === category);
    const unlocked = categoryAchievements.filter(a => a.unlocked).length;
    return {
      category,
      total: categoryAchievements.length,
      unlocked,
      percentage: categoryAchievements.length > 0 ? (unlocked / categoryAchievements.length) * 100 : 0
    };
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Achievements</h1>
          <p className="text-gray-600 mt-2">Track your progress and unlock badges for meeting productivity!</p>
        </div>
        {newCount > 0 && (
          <Badge className="bg-red-500 text-white">
            {newCount} New Badge{newCount > 1 ? 's' : ''}!
          </Badge>
        )}
      </div>

      {/* Overall Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm font-medium">
              <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Unlocked</span>
                <span>{progress.unlocked}/{progress.total}</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
              <div className="text-xs text-gray-500">
                {Math.round(progress.percentage)}% complete
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm font-medium">
              <Star className="h-4 w-4 mr-2 text-blue-500" />
              Recent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {achievements.filter(a => 
                a.unlocked && a.unlockedAt && 
                new Date(a.unlockedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length}
            </div>
            <div className="text-xs text-gray-500">
              This week
            </div>
          </CardContent>
        </Card>

        {/* Rarity Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm font-medium">
              <Zap className="h-4 w-4 mr-2 text-purple-500" />
              Rare Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {achievements.filter(a => 
                a.unlocked && ['rare', 'epic', 'legendary'].includes(a.rarity)
              ).length}
            </div>
            <div className="text-xs text-gray-500">
              Rare+ achievements
            </div>
          </CardContent>
        </Card>

        {/* Next Target */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm font-medium">
              <Target className="h-4 w-4 mr-2 text-green-500" />
              Next Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {achievements.find(a => !a.unlocked)?.name || "All unlocked!"}
            </div>
            <div className="text-xs text-gray-500">
              {achievements.find(a => !a.unlocked) ? "Keep working!" : "Amazing!"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {categoryStats.map(stat => (
              <div key={stat.category} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize font-medium">{stat.category}</span>
                  <span>{stat.unlocked}/{stat.total}</span>
                </div>
                <Progress value={stat.percentage} className="h-2" />
                <div className="text-xs text-gray-500">
                  {Math.round(stat.percentage)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Grid */}
      <AchievementGrid achievements={achievements} showFilters={true} />
    </div>
  );
}