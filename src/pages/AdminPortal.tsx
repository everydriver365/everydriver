import { motion } from "framer-motion";
import { 
  Shield, Users, Calendar, CreditCard, Settings, BarChart3, 
  UserPlus, AlertTriangle, CheckCircle, Clock, TrendingUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { icon: Users, label: "Total Pupils", value: "1,247", change: "+45 this month", trend: "up" },
  { icon: UserPlus, label: "Active Instructors", value: "86", change: "+3 new", trend: "up" },
  { icon: Calendar, label: "Lessons Today", value: "342", change: "On schedule", trend: "neutral" },
  { icon: CreditCard, label: "Revenue (Month)", value: "£48,250", change: "+18%", trend: "up" },
];

const recentUsers = [
  { name: "Alex Thompson", type: "Pupil", joined: "2 hours ago", status: "active" },
  { name: "Sarah Johnson", type: "Instructor", joined: "1 day ago", status: "pending" },
  { name: "Mike Williams", type: "Pupil", joined: "2 days ago", status: "active" },
  { name: "Emma Davis", type: "Parent", joined: "3 days ago", status: "active" },
];

const alerts = [
  { type: "warning", message: "3 instructors haven't updated availability", action: "Remind" },
  { type: "info", message: "12 pending payment approvals", action: "Review" },
  { type: "success", message: "System backup completed", action: "View" },
];

export default function AdminPortal() {
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold md:text-3xl">Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and management</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3"
          >
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button variant="accent" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className={`flex items-center gap-1 text-xs ${
                      stat.trend === "up" ? "text-success" : "text-muted-foreground"
                    }`}>
                      {stat.trend === "up" && <TrendingUp className="h-3 w-3" />}
                      {stat.change}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-accent" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between rounded-lg border p-4 ${
                        alert.type === "warning"
                          ? "border-warning/30 bg-warning/5"
                          : alert.type === "success"
                          ? "border-success/30 bg-success/5"
                          : "border-primary/30 bg-primary/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {alert.type === "warning" ? (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        ) : alert.type === "success" ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <Clock className="h-5 w-5 text-primary" />
                        )}
                        <span>{alert.message}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        {alert.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Management */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                    <Users className="h-6 w-6" />
                    <span>Manage Users</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                    <Calendar className="h-6 w-6" />
                    <span>View Bookings</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                    <CreditCard className="h-6 w-6" />
                    <span>Payments</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-accent" />
                  Recent Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div
                      key={user.name}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {user.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              user.status === "active"
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }`}
                          >
                            {user.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.type} • {user.joined}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4 w-full">
                  View All Users
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
