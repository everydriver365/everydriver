import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Clock, Calendar, CheckCircle, Users, ArrowRight } from "lucide-react";

export default function SemiIntensive() {
  const courses = [
    {
      title: "4 Week Course",
      hours: 30,
      frequency: "2-3 lessons per week",
      description: "The perfect balance between intensive and weekly lessons. Learn at a steady pace without rushing.",
      features: [
        "30 hours of structured training",
        "Practical test included",
        "Theory test support",
        "Progress tracking",
      ],
    },
    {
      title: "6 Week Course",
      hours: 36,
      frequency: "2 lessons per week",
      description: "More time to build confidence and master each skill before moving on.",
      features: [
        "36 hours of comprehensive training",
        "Practical test included",
        "Theory test support",
        "Mock tests included",
      ],
    },
    {
      title: "8 Week Course",
      hours: 40,
      frequency: "1-2 lessons per week",
      description: "Ideal for learners who prefer a relaxed pace with plenty of practice time between lessons.",
      features: [
        "40 hours of thorough training",
        "Practical test included",
        "Full theory support",
        "Flexible scheduling",
      ],
    },
  ];

  return (
    <MainLayout>
      <div className="container py-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 px-4 py-2 rounded-full mb-4">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Most Popular Choice</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">Semi-Intensive Courses</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The best of both worlds - faster than weekly lessons but with time to absorb 
              what you've learned between sessions.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-12">
            <div className="text-center p-6">
              <Clock className="h-10 w-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Balanced Pace</h3>
              <p className="text-sm text-muted-foreground">Pass in 4-8 weeks</p>
            </div>
            <div className="text-center p-6">
              <Calendar className="h-10 w-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Flexible Schedule</h3>
              <p className="text-sm text-muted-foreground">Fits around work or studies</p>
            </div>
            <div className="text-center p-6">
              <Users className="h-10 w-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Popular Choice</h3>
              <p className="text-sm text-muted-foreground">Most learners choose this option</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mb-12">
            {courses.map((course) => (
              <Card key={course.title} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-600">{course.hours} Hours</span>
                    <span className="text-sm text-muted-foreground">{course.frequency}</span>
                  </div>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                  <ul className="space-y-2 mb-6">
                    {course.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full">
                    <Link to="/courses?type=semi-intensive">
                      Find Available Dates
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Why Choose Semi-Intensive?</h2>
            <p className="text-white/90 mb-6 max-w-xl mx-auto">
              Semi-intensive courses give you time to practice and build muscle memory between 
              lessons, leading to better retention and higher pass rates.
            </p>
            <Button asChild variant="secondary" size="lg">
              <Link to="/courses">Browse Available Courses</Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
