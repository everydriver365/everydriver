import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, Shield, Heart } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

export default function About() {
  return (
    <MainLayout>
      <SEOHead
        title="About EveryDriver | UK Driving School Network"
        description="EveryDriver connects UK learners with DVSA-approved driving instructors offering intensive courses, weekly lessons and flexible 0% finance."
      />
      <div className="container py-12 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">About EveryDriver</h1>
            <p className="text-lg text-muted-foreground">
              Helping learners across the UK achieve driving success since 2015
            </p>
          </div>

          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-muted-foreground leading-relaxed">
              EveryDriver was founded with a simple mission: to make learning to drive accessible, 
              affordable, and enjoyable for everyone. We connect learners with experienced, 
              professional driving instructors who are passionate about road safety and helping 
              students pass their test first time.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Our network of DVSA-approved instructors covers every corner of the UK, offering 
              flexible lesson times, competitive rates, and personalised teaching approaches 
              tailored to each learner's needs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-12">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Expert Instructors</h3>
                    <p className="text-sm text-muted-foreground">
                      All our instructors are DVSA-approved with years of experience and excellent pass rates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">High Pass Rates</h3>
                    <p className="text-sm text-muted-foreground">
                      Our students consistently achieve pass rates above the national average.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Safe Learning</h3>
                    <p className="text-sm text-muted-foreground">
                      Modern dual-control vehicles and comprehensive insurance for peace of mind.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Student Focused</h3>
                    <p className="text-sm text-muted-foreground">
                      Flexible scheduling, patient teaching, and support every step of the way.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-primary/5 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              To empower every learner with the skills, confidence, and knowledge they need 
              to become safe, responsible drivers for life.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
