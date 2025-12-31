import { motion } from "framer-motion";
import { GraduationCap, Calendar, BookOpen, CreditCard, Clock, Award, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const upcomingLessons = [
  { date: "Mon 15 Jan", time: "10:00 AM", instructor: "John Smith", type: "1 hour lesson" },
  { date: "Wed 17 Jan", time: "2:00 PM", instructor: "John Smith", type: "2 hour lesson" },
  { date: "Sat 20 Jan", time: "9:00 AM", instructor: "John Smith", type: "Mock Test" },
];

const skills = [
  { name: "Moving Off & Stopping", progress: 100 },
  { name: "Steering Control", progress: 85 },
  { name: "Use of Mirrors", progress: 75 },
  { name: "Roundabouts", progress: 60 },
  { name: "Parallel Parking", progress: 40 },
  { name: "Emergency Stop", progress: 25 },
];

export default function PupilPortal() {
  return (
    <MainLayout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold md:text-3xl">Welcome back, Alex!</h1>
          <p className="text-muted-foreground">Track your progress and manage your lessons</p>
        </motion.div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Clock, label: "Total Hours", value: "24", color: "bg-primary" },
            { icon: Calendar, label: "Lessons Completed", value: "12", color: "bg-success" },
            { icon: BookOpen, label: "Theory Progress", value: "78%", color: "bg-accent" },
            { icon: Award, label: "Skills Mastered", value: "8/15", color: "bg-primary" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Upcoming Lessons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Upcoming Lessons
                </CardTitle>
                <Button variant="outline" size="sm">
                  View Calendar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingLessons.map((lesson, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          <span className="text-xs">{lesson.date.split(" ")[0]}</span>
                          <span className="text-lg font-bold">{lesson.date.split(" ")[1]}</span>
                        </div>
                        <div>
                          <div className="font-medium">{lesson.type}</div>
                          <div className="text-sm text-muted-foreground">
                            {lesson.time} with {lesson.instructor}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="accent" className="mt-4 w-full">
                  Book New Lesson
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Progress Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-accent" />
                  Skill Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {skills.map((skill) => (
                    <div key={skill.name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{skill.name}</span>
                        <span className="text-muted-foreground">{skill.progress}%</span>
                      </div>
                      <Progress value={skill.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Payment Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent" />
                Payments & Packages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Current Balance</div>
                  <div className="text-3xl font-bold text-success">£120.00</div>
                  <div className="text-sm text-muted-foreground">4 lessons remaining</div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">View History</Button>
                  <Button variant="accent">Top Up Balance</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
