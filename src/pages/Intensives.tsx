import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, Clock, Calendar, CheckCircle, Star, ArrowRight } from "lucide-react";

export default function Intensives() {
  const courses = [
    {
      title: "Test in a Week",
      hours: 28,
      duration: "5-7 days",
      description: "Our most popular intensive course. Perfect if you need to pass quickly for work or university.",
      features: [
        "28 hours of intensive training",
        "Practical test included",
        "Theory test support",
        "Free re-test if needed",
      ],
    },
    {
      title: "Two Week Intensive",
      hours: 36,
      duration: "10-14 days",
      description: "A slightly more relaxed pace while still getting you on the road fast.",
      features: [
        "36 hours of comprehensive training",
        "Practical test included",
        "Theory test support",
        "Mock tests included",
      ],
    },
    {
      title: "Fast Track 20",
      hours: 20,
      duration: "3-5 days",
      description: "For learners with some experience who need a quick refresher and test preparation.",
      features: [
        "20 hours of focused training",
        "Practical test included",
        "Test route practice",
        "Manoeuvres mastery",
      ],
    },
  ];

  return (
    <MainLayout>
      <div className="container py-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Fast Track Your Licence</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">Intensive Driving Courses</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pass your driving test in as little as one week with our intensive courses. 
              Perfect for busy schedules or urgent driving needs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-12">
            <div className="text-center p-6">
              <Clock className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Quick Results</h3>
              <p className="text-sm text-muted-foreground">Pass in as little as 5-7 days</p>
            </div>
            <div className="text-center p-6">
              <Calendar className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Flexible Dates</h3>
              <p className="text-sm text-muted-foreground">Start dates to suit your schedule</p>
            </div>
            <div className="text-center p-6">
              <Star className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">High Pass Rate</h3>
              <p className="text-sm text-muted-foreground">90%+ first-time pass rate</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mb-12">
            {courses.map((course) => (
              <Card key={course.title} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">{course.hours} Hours</span>
                    <span className="text-sm text-muted-foreground">{course.duration}</span>
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
                    <Link to="/courses?type=intensive">
                      Find Available Dates
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
              Enter your postcode to find intensive courses available in your area
            </p>
            <Button asChild variant="secondary" size="lg">
              <Link to="/courses">Find Courses Near You</Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
