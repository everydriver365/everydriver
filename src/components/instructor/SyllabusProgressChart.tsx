import { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DVSA_SYLLABUS, SYLLABUS_CATEGORIES } from '@/constants/dvsaSyllabus';

interface SyllabusProgressChartProps {
  progress: { competency_id: string; level: number }[];
  className?: string;
}

export function SyllabusProgressChart({ progress, className }: SyllabusProgressChartProps) {
  const chartData = useMemo(() => {
    return SYLLABUS_CATEGORIES.map(category => {
      const categoryCompetencies = DVSA_SYLLABUS.filter(c => c.category === category);
      const totalPoints = categoryCompetencies.reduce((sum, comp) => {
        const entry = progress.find(p => p.competency_id === comp.id);
        return sum + (entry?.level || 0);
      }, 0);
      const maxPoints = categoryCompetencies.length * 5;
      const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

      return {
        category: category.split(' ')[0], // Shorten for display
        fullCategory: category,
        value: percentage,
        fullMark: 100,
      };
    });
  }, [progress]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Skills Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="category" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickCount={5}
              />
              <Radar
                name="Progress"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          {chartData.map((item) => (
            <div key={item.fullCategory} className="flex items-center justify-between px-2 py-1 bg-muted/50 rounded">
              <span className="text-muted-foreground truncate">{item.fullCategory}</span>
              <span className="font-medium ml-2">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
