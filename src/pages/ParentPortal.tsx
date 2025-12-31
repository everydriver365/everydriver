import { motion } from "framer-motion";
import { Users, Calendar, CreditCard, FileText, Clock, MapPin, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const children = [
  {
    name: "Alex Thompson",
    instructor: "John Smith",
    lessonsCompleted: 12,
    totalLessons: 20,
    nextLesson: "Mon 15 Jan, 10:00 AM",
    balance: "£120.00",
    progress: 65,
  },
  {
    name: "Emma Thompson",
    instructor: "Sarah Johnson",
    lessonsCompleted: 5,
    totalLessons: 15,
    nextLesson: "Tue 16 Jan, 2:00 PM",
    balance: "£80.00",
    progress: 33,
  },
];

const recentActivity = [
  { icon: Calendar, text: "Alex completed a 2hr lesson", time: "2 hours ago" },
  { icon: CreditCard, text: "Payment of £70 received", time: "Yesterday" },
  { icon: FileText, text: "Progress report available for Alex", time: "2 days ago" },
  { icon: Bell, text: "Emma's lesson rescheduled to Tuesday", time: "3 days ago" },
];

export default function ParentPortal() {
  return (
    <MainLayout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold md:text-3xl">Parent Dashboard</h1>
          <p className="text-muted-foreground">Monitor your children's driving progress</p>
        </motion.div>

        {/* Children Overview */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {children.map((child, index) => (
            <motion.div
              key={child.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                        {child.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{child.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Instructor: {child.instructor}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-lg bg-secondary p-3">
                      <div className="text-xl font-bold">{child.lessonsCompleted}</div>
                      <div className="text-xs text-muted-foreground">Lessons Done</div>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <div className="text-xl font-bold">{child.progress}%</div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                    <div className="rounded-lg bg-success/10 p-3">
                      <div className="text-xl font-bold text-success">{child.balance}</div>
                      <div className="text-xs text-muted-foreground">Balance</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Learning Progress</span>
                      <span>{child.progress}%</span>
                    </div>
                    <Progress value={child.progress} className="h-2" />
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/10 p-3">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="text-sm">
                      <strong>Next lesson:</strong> {child.nextLesson}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-accent" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 rounded-lg border p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <activity.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{activity.text}</div>
                        <div className="text-sm text-muted-foreground">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="accent" className="w-full justify-start">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Top Up Balance
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Schedule
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Progress Reports
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Contact Instructor
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
