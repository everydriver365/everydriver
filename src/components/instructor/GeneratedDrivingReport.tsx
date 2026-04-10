import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  Target, 
  ShieldCheck,
  Heart,
  Loader2,
  FileText,
  Share2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DrivingFeedback {
  overallAssessment: string;
  strengths: string[];
  areasToImprove: string[];
  practiceRecommendations: string[];
  safetyNotes: string | null;
  encouragement: string;
}

interface SessionStats {
  distance: string;
  avgSpeed: string | null;
  maxSpeed: string | null;
  goodEvents: number;
  badEvents: number;
}

interface GeneratedDrivingReportProps {
  telematicsId: string;
  pupilName: string;
  onClose?: () => void;
}

export const GeneratedDrivingReport: React.FC<GeneratedDrivingReportProps> = ({
  telematicsId,
  pupilName,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{
    drivingScore: number;
    sessionStats: SessionStats;
    feedback: DrivingFeedback;
  } | null>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-driving-report', {
        body: { telematicsId, pupilName }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setReport(data);
      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!report) return;
    
    const text = `
Driving Lesson Report for ${pupilName}
Score: ${report.drivingScore}/100

${report.feedback.overallAssessment}

Strengths:
${report.feedback.strengths.map(s => `• ${s}`).join('\n')}

Areas to Improve:
${report.feedback.areasToImprove.map(a => `• ${a}`).join('\n')}

${report.feedback.encouragement}
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({ title: `Driving Report - ${pupilName}`, text });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Report copied to clipboard!');
    }
  };

  if (!report) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Sparkles className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI-Powered Lesson Feedback</h3>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
            Generate personalized feedback and recommendations based on the driving data from this lesson.
          </p>
          <Button onClick={generateReport} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { drivingScore, sessionStats, feedback } = report;

  return (
    <div className="space-y-4">
      {/* Header with Score */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Lesson Feedback
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Score Display */}
          <div className="flex items-center gap-6 mb-4">
            <div className="relative">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90">
                <circle
                  cx="40" cy="40" r="35"
                  fill="none" stroke="currentColor" strokeWidth="6"
                  className="text-muted/20"
                />
                <circle
                  cx="40" cy="40" r="35"
                  fill="none" stroke="currentColor" strokeWidth="6"
                  strokeDasharray={`${(drivingScore / 100) * 220} 220`}
                  strokeLinecap="round"
                  className={drivingScore >= 80 ? 'text-green-500' : drivingScore >= 50 ? 'text-amber-500' : 'text-red-500'}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{drivingScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{feedback.overallAssessment}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted/50 rounded-none">
              <p className="text-lg font-bold">{sessionStats.distance} km</p>
              <p className="text-xs text-muted-foreground">Distance</p>
            </div>
            <div className="p-2 bg-green-500/10 rounded-none">
              <p className="text-lg font-bold text-green-600">{sessionStats.goodEvents}</p>
              <p className="text-xs text-muted-foreground">Good</p>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-none">
              <p className="text-lg font-bold text-amber-600">{sessionStats.badEvents}</p>
              <p className="text-xs text-muted-foreground">To Improve</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {feedback.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                {strength}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Areas to Improve */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Areas to Improve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {feedback.areasToImprove.map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                {area}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Practice Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Next Lesson Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {feedback.practiceRecommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Safety Notes */}
      {feedback.safetyNotes && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <ShieldCheck className="h-4 w-4" />
              Safety Note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{feedback.safetyNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Encouragement */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm italic">{feedback.encouragement}</p>
          </div>
        </CardContent>
      </Card>

      {/* Regenerate Button */}
      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={generateReport} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Regenerate Feedback
        </Button>
      </div>
    </div>
  );
};

export default GeneratedDrivingReport;