import React from 'react';
import WelcomeBanner from '@/components/WelcomeBanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileTextIcon, CheckCircleIcon, ClockIcon, TrendingUpIcon } from 'lucide-react';
import { getUserDisplayName } from '@/lib/jwt';

interface StatsCard {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: string;
}

function Dashboard() {
  // Get user's display name from JWT token
  const userName = getUserDisplayName();

  // Mock data - replace with actual data from API
  const stats: StatsCard[] = [
    {
      title: 'Total Forms',
      value: '12',
      description: 'Active QA forms',
      icon: <FileTextIcon className="w-5 h-5" />,
      trend: '+2 this week',
    },
    {
      title: 'Completed',
      value: '847',
      description: 'Total submissions',
      icon: <CheckCircleIcon className="w-5 h-5" />,
      trend: '+123 this week',
    },
    {
      title: 'Pending',
      value: '23',
      description: 'Awaiting review',
      icon: <ClockIcon className="w-5 h-5" />,
    },
    {
      title: 'Success Rate',
      value: '94%',
      description: 'Quality score',
      icon: <TrendingUpIcon className="w-5 h-5" />,
      trend: '+3% this month',
    },
  ];

  return (
    <>
      {/* Welcome Banner */}
      <WelcomeBanner userName={userName} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                {stat.trend && (
                  <p className="text-xs text-primary font-medium mt-2">
                    {stat.trend}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Forms</CardTitle>
              <CardDescription>Your latest QA forms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <FileTextIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          QA Form #{i}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated 2 hours ago
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full h-auto text-left p-3 justify-start">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Create New Form
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Start building a new QA form
                    </p>
                  </div>
                </Button>
                <Button variant="outline" className="w-full h-auto text-left p-3 justify-start">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      View Analytics
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Check your performance metrics
                    </p>
                  </div>
                </Button>
                <Button variant="outline" className="w-full h-auto text-left p-3 justify-start">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Export Reports
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Download your QA reports
                    </p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </>
  );
}

export default Dashboard;
