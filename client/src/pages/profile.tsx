import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "@/components/project-card";
import { Edit, MapPin, Globe, Instagram, Youtube, Twitter, TrendingUp } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { User, Project } from "@shared/schema";

export default function Profile() {
  const { id } = useParams<{ id?: string }>();
  const [activeTab, setActiveTab] = useState("portfolio");

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/users", id || "me"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects", id || "me"],
  });

  // Mock data for profile views chart
  const profileViewsData = [
    { date: "Jan", views: 150 },
    { date: "Feb", views: 280 },
    { date: "Mar", views: 320 },
    { date: "Apr", views: 450 },
    { date: "May", views: 550 },
    { date: "Jun", views: 720 },
  ];

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-48 bg-card rounded-2xl" />
          <div className="h-96 bg-card rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        {/* Cover Image */}
        {user.coverImageUrl && (
          <div className="h-48 bg-gradient-to-r from-primary/20 to-accent/20 relative">
            <img
              src={user.coverImageUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {!user.coverImageUrl && (
          <div className="h-48 bg-gradient-to-r from-primary/20 to-accent/20" />
        )}

        {/* Profile Info */}
        <div className="p-6 md:p-8 -mt-16 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            <Avatar className="h-32 w-32 ring-4 ring-primary ring-offset-4 ring-offset-background">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                {user.displayName?.charAt(0) || user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold" data-testid="text-display-name">
                      {user.displayName || user.username}
                    </h1>
                    <p className="text-muted-foreground">@{user.username}</p>
                  </div>
                  <Button size="sm" data-testid="button-edit-profile">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>

                {user.bio && (
                  <p className="text-foreground max-w-2xl" data-testid="text-bio">
                    {user.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user.creatorType && (
                    <Badge variant="secondary">{user.creatorType}</Badge>
                  )}
                </div>

                {/* Social Accounts */}
                {user.socialAccounts && (
                  <div className="flex gap-2">
                    {user.socialAccounts.instagram && (
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={`https://instagram.com/${user.socialAccounts.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="link-instagram"
                        >
                          <Instagram className="h-5 w-5" />
                        </a>
                      </Button>
                    )}
                    {user.socialAccounts.tiktok && (
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={`https://tiktok.com/@${user.socialAccounts.tiktok}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="link-tiktok"
                        >
                          <SiTiktok className="h-5 w-5" />
                        </a>
                      </Button>
                    )}
                    {user.socialAccounts.youtube && (
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={`https://youtube.com/@${user.socialAccounts.youtube}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="link-youtube"
                        >
                          <Youtube className="h-5 w-5" />
                        </a>
                      </Button>
                    )}
                    {user.socialAccounts.twitter && (
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={`https://twitter.com/${user.socialAccounts.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="link-twitter"
                        >
                          <Twitter className="h-5 w-5" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border">
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="text-total-connections">
                    {user.totalConnections?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Connections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="text-total-views">
                    {user.totalProfileViews?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Profile Views</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="text-total-earnings">
                    ${user.totalEarnings || "0"}
                  </div>
                  <div className="text-sm text-muted-foreground">Earnings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="portfolio" data-testid="tab-portfolio">
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="groups" data-testid="tab-groups">
            Groups
          </TabsTrigger>
          <TabsTrigger value="bookmarks" data-testid="tab-bookmarks">
            Bookmarks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Projects</h2>
            <Button data-testid="button-add-project">
              + Add Project
            </Button>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No projects yet</p>
              <Button className="mt-4">Create Your First Project</Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Profile Views</h3>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-chart-4" />
                  <span className="text-chart-4 font-medium">+23.5%</span>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={profileViewsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Audience Age</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">18-24</span>
                  <span className="font-medium">35%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">25-34</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">35+</span>
                  <span className="font-medium">20%</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Engagement Rate</h3>
              <div className="text-4xl font-bold text-primary mb-2">8.3%</div>
              <p className="text-sm text-muted-foreground">
                Above average for your category
              </p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="groups">
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No groups joined yet</p>
          </Card>
        </TabsContent>

        <TabsContent value="bookmarks">
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No bookmarks yet</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
