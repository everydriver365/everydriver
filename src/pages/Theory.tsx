import { MainLayout } from "@/components/layout/MainLayout";
import { BookOpen, CheckCircle, Clock, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Theory() {
  return (
    <MainLayout>
      <div className="container py-8 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Theory Test Preparation</h1>
            <p className="text-muted-foreground mt-2">
              Everything you need to pass your theory test first time
            </p>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  Practice Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Over 700 official DVSA questions with detailed explanations.
                </p>
                <Button>Start Practice</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Mock Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Timed mock tests that simulate the real exam conditions.
                </p>
                <Button variant="outline">Take Mock Test</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Hazard Perception
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Interactive hazard perception clips to sharpen your skills.
                </p>
                <Button variant="outline">Practice Hazards</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
