
import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Edit, MapPin, Settings, Share2, Grid3x3, List, MessageCircle, UserPlus, UserCheck } from "lucide-react";
import type { User, Project } from "@shared/schema";

export default function Profile() {
  const { id } = useParams<{ id?: string }>();
  const { user: privyUser, authenticated } = usePrivy();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("projects");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    displayName: "",
    bio: "",
    location: "",
  });

  // Determine if viewing own profile
  const isOwnProfile = !id || (privyUser?.wallet?.address && id === privyUser.wallet.address);
  const profileUserId = id || privyUser?.wallet?.address;

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/users", profileUserId],
    enabled: !!profileUserId,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects", profileUserId],
    enabled: !!profileUserId,
  });

  useEffect(() => {
    if (user) {
      setEditData({
        displayName: user.displayName || "",
        bio: user.bio || "",
        location: user.location || "",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await fetch(`/api/users/${profileUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully" });
      setIsEditModalOpen(false);
    },
  });

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${profileUserId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${user?.displayName || user?.username}'s Profile`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied to clipboard" });
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  if (!authenticated && !id) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Please login to view your profile</p>
      </div>
    );
  }

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
    <div className="container max-w-5xl mx-auto px-4 py-8">
      {/* Header Section - Instagram Style */}
      <div className="mb-8">
        <div className="flex items-start gap-8 mb-6">
          {/* Avatar */}
          <Avatar className="h-40 w-40 ring-2 ring-border">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-5xl">
              {user.displayName?.charAt(0) || user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              {isOwnProfile ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 text-sm">
              <div>
                <span className="font-bold">{projects.length}</span> projects
              </div>
              <div>
                <span className="font-bold">{user.totalConnections || 0}</span> connections
              </div>
              <div>
                <span className="font-bold">{user.totalProfileViews || 0}</span> views
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              {user.displayName && (
                <p className="font-semibold">{user.displayName}</p>
              )}
              {user.bio && (
                <p className="text-sm whitespace-pre-wrap">{user.bio}</p>
              )}
              {user.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.creatorType && (
                <Badge variant="secondary">{user.creatorType}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between border-t border-border">
          <TabsList className="bg-transparent h-12">
            <TabsTrigger value="projects" className="gap-2">
              <Grid3x3 className="h-4 w-4" />
              PROJECTS
            </TabsTrigger>
            <TabsTrigger value="coins" className="gap-2">
              COINS
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="saved" className="gap-2">
                SAVED
              </TabsTrigger>
            )}
          </TabsList>

          {activeTab === "projects" && (
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="projects" className="mt-0">
          {projects.length > 0 ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-3 gap-1" 
              : "space-y-4"
            }>
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className={viewMode === "grid" 
                    ? "aspect-square overflow-hidden cursor-pointer" 
                    : "p-4"
                  }
                >
                  {project.imageUrl && (
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {viewMode === "list" && (
                    <div className="mt-2">
                      <h3 className="font-semibold">{project.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No projects yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="coins">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No coins yet</p>
          </div>
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="saved">
            <div className="text-center py-12">
              <p className="text-muted-foreground">No saved items</p>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Display Name</label>
              <Input
                value={editData.displayName}
                onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Bio</label>
              <Textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Input
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                placeholder="City, Country"
              />
            </div>
            <Button
              onClick={() => updateProfileMutation.mutate(editData)}
              disabled={updateProfileMutation.isPending}
              className="w-full"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
