import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMeetingInsights } from "@/hooks/use-insights";
import { 
  Brain, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  Target, 
  MessageSquare,
  Star,
  AlertTriangle,
  Lightbulb
} from "lucide-react";

interface MeetingInsightsProps {
  meetingId: number;
  meetingTitle: string;
}

export default function MeetingInsights({ meetingId, meetingTitle }: MeetingInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: insights, isLoading, error, refetch } = useMeetingInsights(meetingId, isOpen);

  const handleGenerateInsights = () => {
    setIsOpen(true);
    refetch();
  };

  const getSentimentColor = (tone: string) => {
    switch (tone) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffectivenessColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) {
    return (
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <span className="font-medium">AI Meeting Insights</span>
            </div>
            <Button onClick={handleGenerateInsights} disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Insights"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const errorMessage = error?.message || 'Failed to generate insights. Please try again.';
    const isQuotaError = errorMessage.includes('quota exceeded');
    
    return (
      <Card className="mt-4 border-red-200">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-2 text-red-700">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">AI Insights Unavailable</p>
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
      <Card className="mt-4">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Brain className="h-5 w-5 animate-pulse text-blue-600" />
            <span>Analyzing meeting with AI...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>AI Meeting Insights</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="effectiveness">Effectiveness</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div>
              <h4 className="font-medium flex items-center mb-2">
                <Target className="h-4 w-4 mr-1" />
                Key Discussion Points
              </h4>
              <ul className="space-y-1">
                {insights.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <CheckCircle className="h-3 w-3 mt-1 text-green-600 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium flex items-center mb-2">
                <ArrowRight className="h-4 w-4 mr-1" />
                Next Steps
              </h4>
              <ul className="space-y-1">
                {insights.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <ArrowRight className="h-3 w-3 mt-1 text-blue-600 flex-shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div>
              <h4 className="font-medium flex items-center mb-2">
                <Lightbulb className="h-4 w-4 mr-1 text-yellow-600" />
                Recommended Actions
              </h4>
              <ul className="space-y-2">
                {insights.actionRecommendations.map((action, index) => (
                  <li key={index} className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400 text-sm">
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium flex items-center mb-2">
                <MessageSquare className="h-4 w-4 mr-1 text-blue-600" />
                Follow-up Suggestions
              </h4>
              <ul className="space-y-1">
                {insights.followUpSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <ArrowRight className="h-3 w-3 mt-1 text-blue-600 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Meeting Tone</h4>
              <Badge className={getSentimentColor(insights.sentimentAnalysis.tone)}>
                {insights.sentimentAnalysis.tone.charAt(0).toUpperCase() + insights.sentimentAnalysis.tone.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-gray-700">{insights.sentimentAnalysis.summary}</p>
            <div className="text-xs text-gray-500">
              Confidence: {Math.round(insights.sentimentAnalysis.confidence * 100)}%
            </div>
          </TabsContent>

          <TabsContent value="effectiveness" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Meeting Effectiveness</h4>
              <div className="flex items-center space-x-2">
                <Star className={`h-5 w-5 ${getEffectivenessColor(insights.effectiveness.score)}`} />
                <span className={`font-bold ${getEffectivenessColor(insights.effectiveness.score)}`}>
                  {insights.effectiveness.score}/10
                </span>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-green-700 mb-2">Strengths</h5>
              <ul className="space-y-1">
                {insights.effectiveness.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <CheckCircle className="h-3 w-3 mt-1 text-green-600 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-orange-700 mb-2">Areas for Improvement</h5>
              <ul className="space-y-1">
                {insights.effectiveness.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <TrendingUp className="h-3 w-3 mt-1 text-orange-600 flex-shrink-0" />
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}