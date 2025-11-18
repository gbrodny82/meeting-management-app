import { GoogleGenAI } from "@google/genai";
import type { Meeting, Action } from "@shared/schema";

// Using Google Gemini 2.5 Flash for AI insights
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface MeetingInsights {
  keyPoints: string[];
  actionRecommendations: string[];
  followUpSuggestions: string[];
  sentimentAnalysis: {
    tone: 'positive' | 'neutral' | 'negative';
    confidence: number;
    summary: string;
  };
  effectiveness: {
    score: number; // 1-10
    strengths: string[];
    improvements: string[];
  };
  nextSteps: string[];
}

export async function generateMeetingInsights(
  meeting: Meeting, 
  existingActions: Action[] = []
): Promise<MeetingInsights> {
  try {
    const existingActionsText = existingActions.length > 0 
      ? `\n\nExisting Actions:\n${existingActions.map(a => `- ${a.text} (${a.assignee}, ${a.priority} priority)`).join('\n')}`
      : '';

    const prompt = `Analyze this meeting and provide comprehensive insights:

Meeting Title: ${meeting.title || 'Meeting with ' + meeting.employeeName}
Participant: ${meeting.employeeName}
Date: ${meeting.date}
Notes: ${meeting.notes}${existingActionsText}

Please provide a detailed analysis in JSON format with the following structure:
{
  "keyPoints": ["Array of 3-5 most important discussion points"],
  "actionRecommendations": ["Array of 3-5 suggested action items based on the discussion"],
  "followUpSuggestions": ["Array of 2-4 specific follow-up recommendations"],
  "sentimentAnalysis": {
    "tone": "positive/neutral/negative",
    "confidence": 0.0-1.0,
    "summary": "Brief summary of the meeting tone and atmosphere"
  },
  "effectiveness": {
    "score": 1-10,
    "strengths": ["What went well in this meeting"],
    "improvements": ["Areas for improvement in future meetings"]
  },
  "nextSteps": ["Array of 2-4 concrete next steps"]
}

Focus on being practical and actionable. Consider the context of a manager meeting with a team member.`;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "You are an expert meeting analyst and management consultant. Provide practical, actionable insights for improving team management and meeting effectiveness. Always respond with valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            keyPoints: { type: "array", items: { type: "string" } },
            actionRecommendations: { type: "array", items: { type: "string" } },
            followUpSuggestions: { type: "array", items: { type: "string" } },
            sentimentAnalysis: {
              type: "object",
              properties: {
                tone: { type: "string", enum: ["positive", "neutral", "negative"] },
                confidence: { type: "number" },
                summary: { type: "string" }
              },
              required: ["tone", "confidence", "summary"]
            },
            effectiveness: {
              type: "object",
              properties: {
                score: { type: "number" },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } }
              },
              required: ["score", "strengths", "improvements"]
            },
            nextSteps: { type: "array", items: { type: "string" } }
          },
          required: ["keyPoints", "actionRecommendations", "followUpSuggestions", "sentimentAnalysis", "effectiveness", "nextSteps"]
        }
      },
      contents: prompt,
    });

    const insights = JSON.parse(response.text || '{}');
    
    // Validate and ensure proper structure
    return {
      keyPoints: insights.keyPoints || [],
      actionRecommendations: insights.actionRecommendations || [],
      followUpSuggestions: insights.followUpSuggestions || [],
      sentimentAnalysis: {
        tone: insights.sentimentAnalysis?.tone || 'neutral',
        confidence: Math.max(0, Math.min(1, insights.sentimentAnalysis?.confidence || 0.5)),
        summary: insights.sentimentAnalysis?.summary || 'No sentiment analysis available'
      },
      effectiveness: {
        score: Math.max(1, Math.min(10, insights.effectiveness?.score || 5)),
        strengths: insights.effectiveness?.strengths || [],
        improvements: insights.effectiveness?.improvements || []
      },
      nextSteps: insights.nextSteps || []
    };

  } catch (error) {
    console.error('Error generating meeting insights:', error);
    
    // Handle specific Gemini errors
    if (error.status === 429) {
      throw new Error('Gemini API rate limit reached. Please try again in a few minutes.');
    } else if (error.status === 401 || error.status === 403) {
      throw new Error('Gemini API key is invalid or access denied. Please check your Google AI API key configuration.');
    } else if (error.message?.includes('quota')) {
      throw new Error('Gemini API quota exceeded. Please check your Google AI billing and usage limits.');
    }
    
    throw new Error('Failed to generate meeting insights: ' + (error as Error).message);
  }
}

export async function generateBulkInsights(meetings: Meeting[]): Promise<string> {
  try {
    if (meetings.length === 0) {
      return "No meetings available for analysis.";
    }

    const meetingsText = meetings.map(meeting => 
      `Meeting with ${meeting.employeeName} (${meeting.date}):\n${meeting.notes}\n`
    ).join('\n---\n');

    const prompt = `Analyze these recent meetings and provide high-level team insights:

${meetingsText}

Provide insights about:
1. Overall team health and morale
2. Common themes and patterns across meetings
3. Team productivity trends
4. Key areas needing attention
5. Recommendations for team leadership

Keep the analysis concise but insightful, focusing on actionable management recommendations.`;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "You are an expert team management consultant. Analyze meeting patterns to provide strategic insights for team leadership and organizational improvement."
      },
      contents: prompt,
    });

    return response.text || 'Unable to generate team insights.';

  } catch (error) {
    console.error('Error generating bulk insights:', error);
    
    // Handle specific Gemini errors
    if (error.status === 429) {
      throw new Error('Gemini API rate limit reached. Please try again in a few minutes.');
    } else if (error.status === 401 || error.status === 403) {
      throw new Error('Gemini API key is invalid or access denied. Please check your Google AI API key configuration.');
    } else if (error.message?.includes('quota')) {
      throw new Error('Gemini API quota exceeded. Please check your Google AI billing and usage limits.');
    }
    
    throw new Error('Failed to generate team insights: ' + (error as Error).message);
  }
}