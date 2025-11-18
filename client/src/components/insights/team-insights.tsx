import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeamInsights } from "@/hooks/use-insights";
import { Brain, Users, TrendingUp, AlertTriangle } from "lucide-react";

export default function TeamInsights() {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading, error, refetch } = useTeamInsights(isOpen);

  const handleGenerateInsights = () => {
    setIsOpen(true);
    refetch();
  };

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Team Insights</h3>
                <p className="text-sm text-gray-600">AI-powered team analysis</p>
              </div>
            </div>
            <Button onClick={handleGenerateInsights} disabled={isLoading}>
              <Brain className="h-4 w-4 mr-2" />
              {isLoading ? "Analyzing..." : "Generate Insights"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const errorMessage = error?.message || 'Failed to generate team insights. Please try again.';
    const isQuotaError = errorMessage.includes('quota exceeded');
    
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-start space-x-2 text-red-700">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">AI Team Insights Unavailable</p>
                <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                {isQuotaError && (
                  <p className="text-xs text-gray-600 mt-2">
                    To restore AI insights, please check your Google AI billing at aistudio.google.com
                  </p>
                )}
              </div>
            </div>
            {!isQuotaError && (
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Brain className="h-6 w-6 animate-pulse text-purple-600" />
            <span>Analyzing team patterns with AI...</span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span>AI Team Insights</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Based on {data.meetingCount} recent meetings
            </span>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              ×
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {data.insights}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="flex items-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Refresh Analysis</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}