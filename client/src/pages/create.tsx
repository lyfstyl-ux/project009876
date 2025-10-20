import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Link as LinkIcon, Sparkles, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const createProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  sourceUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

export default function Create() {
  const [step, setStep] = useState<"input" | "preview" | "minting">("input");
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("url");
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      sourceUrl: "",
      thumbnailUrl: "",
    },
  });

  const onSubmit = async (data: CreateProjectForm) => {
    console.log("Creating project:", data);
    setStep("preview");
    toast({
      title: "Project created!",
      description: "Your project is ready to be minted as a creator coin.",
    });
  };

  const handleMint = async () => {
    setStep("minting");
    // Simulate minting process
    setTimeout(() => {
      toast({
        title: "Successfully minted!",
        description: "Your creator coin is now tradeable on the marketplace.",
      });
    }, 2000);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
    // Implement actual search logic here
    toast({
      title: "Search initiated",
      description: `Looking for "${searchQuery}"...`,
    });
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Create Project</h1>
          <p className="text-muted-foreground">
            Turn your content into a tradeable creator coin
          </p>
        </div>
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Button type="submit" size="icon" aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
        </form>
      </div>


      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${step === "input" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
            step === "input" ? "border-primary bg-primary/10" : "border-muted"
          }`}>
            1
          </div>
          <span className="text-sm font-medium">Details</span>
        </div>
        <div className="h-px w-12 bg-border" />
        <div className={`flex items-center gap-2 ${step === "preview" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
            step === "preview" ? "border-primary bg-primary/10" : "border-muted"
          }`}>
            2
          </div>
          <span className="text-sm font-medium">Preview</span>
        </div>
        <div className="h-px w-12 bg-border" />
        <div className={`flex items-center gap-2 ${step === "minting" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
            step === "minting" ? "border-primary bg-primary/10" : "border-muted"
          }`}>
            3
          </div>
          <span className="text-sm font-medium">Mint</span>
        </div>
      </div>

      {/* Input Step */}
      {step === "input" && (
        <Card className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Upload Method */}
              <div className="space-y-4">
                <FormLabel>Content Source</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={uploadMethod === "url" ? "default" : "outline"}
                    onClick={() => setUploadMethod("url")}
                    data-testid="button-upload-url"
                    className="h-24"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <LinkIcon className="h-6 w-6" />
                      <span>URL</span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMethod === "file" ? "default" : "outline"}
                    onClick={() => setUploadMethod("file")}
                    data-testid="button-upload-file"
                    className="h-24"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6" />
                      <span>File Upload</span>
                    </div>
                  </Button>
                </div>
              </div>

              {uploadMethod === "url" && (
                <FormField
                  control={form.control}
                  name="sourceUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/your-content"
                          {...field}
                          data-testid="input-source-url"
                        />
                      </FormControl>
                      <FormDescription>
                        Link to your blog post, video, music, or other content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {uploadMethod === "file" && (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover-elevate transition-all cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, GIF, MP4 up to 50MB
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Amazing Project"
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your project..."
                        className="min-h-32"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="art">Art</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="writing">Writing</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="tech">Tech</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg" data-testid="button-continue">
                Continue to Preview
              </Button>
            </form>
          </Form>
        </Card>
      )}

      {/* Preview Step */}
      {step === "preview" && (
        <Card className="p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Preview Your Project</h2>
            <p className="text-muted-foreground">
              Review your project details before minting
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Title</h3>
              <p>{form.getValues("title")}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{form.getValues("description")}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Category</h3>
              <p className="capitalize">{form.getValues("category")}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setStep("input")}
              className="flex-1"
              data-testid="button-back"
            >
              Back
            </Button>
            <Button
              onClick={handleMint}
              className="flex-1"
              data-testid="button-mint"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Mint Creator Coin
            </Button>
          </div>
        </Card>
      )}

      {/* Minting Step */}
      {step === "minting" && (
        <Card className="p-12 text-center space-y-4">
          <div className="animate-pulse">
            <Sparkles className="h-16 w-16 mx-auto text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Minting Your Creator Coin...</h2>
          <p className="text-muted-foreground">
            Please wait while we deploy your coin on Base blockchain
          </p>
        </Card>
      )}
    </div>
  );
}