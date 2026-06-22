import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, PlusIcon, AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ROUTES } from "@/config/routes";
import { useFormCycleById } from "@/hooks/useFormCycleById";
import { useCreateSection } from "@/hooks/useCreateSection";
import { useQueryClient } from "@tanstack/react-query";
import type { FormDetailSection } from "@/services/formService";

function FormEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionError, setSectionError] = useState("");

  // Fetch form cycle details
  const {
    data: formCycle,
    isLoading: isLoadingCycle,
    isError: isCycleError,
    error: cycleError
  } = useFormCycleById(id);

  // Create section mutation
  const { mutate: createSection, isPending: isCreatingSection } = useCreateSection({
    onSuccess: async () => {
      toast.success("Section added successfully!");
      setSectionTitle("");
      setSectionError("");
      setIsAddSectionOpen(false);
      
      // Invalidate the form cycle query to refetch and show the new section
      await queryClient.invalidateQueries({ queryKey: ["formCycle", id] });
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to create section";
      setSectionError(errorMessage);
      toast.error("Error", {
        description: errorMessage,
      });
    },
  });

  // Handle invalid ID
  if (!id) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Invalid form cycle ID</p>
      </div>
    );
  }

  // Loading state
  if (isLoadingCycle) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  // Error state for form cycle
  if (isCycleError) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center gap-4">
          <AlertCircleIcon className="size-12 text-destructive" />
          <div>
            <p className="text-destructive font-semibold mb-2">Failed to load form cycle</p>
            <p className="text-sm text-muted-foreground">{cycleError?.message || "An error occurred"}</p>
          </div>
          <Button variant="outline" onClick={() => navigate(ROUTES.DASHBOARD_FORMS)}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Forms
          </Button>
        </div>
      </div>
    );
  }

  // Form cycle not found
  if (!formCycle) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Form cycle not found</p>
      </div>
    );
  }

  const handleAddSection = () => {
    setSectionError("");
    
    if (!sectionTitle.trim()) {
      setSectionError("Section title is required");
      return;
    }

    // Calculate the next display order
    const nextDisplayOrder = formCycle.sections.length > 0
      ? Math.max(...formCycle.sections.map(s => s.display_order)) + 1
      : 1;

    createSection({
      formCycleId: id,
      data: {
        title: sectionTitle.trim(),
        display_order: nextDisplayOrder,
      },
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && isCreatingSection) {
      return; // Prevent closing while creating
    }
    setIsAddSectionOpen(open);
    if (open) {
      setSectionError("");
    } else {
      setSectionTitle("");
      setSectionError("");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      active: { variant: "default", label: "Active" },
      completed: { variant: "outline", label: "Completed" },
    };
    const config = statusMap[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(ROUTES.DASHBOARD_FORMS)} className="mb-4">
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Forms
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{formCycle.title}</h1>
            {getStatusBadge(formCycle.status)}
          </div>
          {formCycle.description && (
            <p className="text-muted-foreground">{formCycle.description}</p>
          )}
        </div>
      </div>

      {/* Sections Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sections</CardTitle>
              <CardDescription>
                Organize your form with sections
              </CardDescription>
            </div>
            <Dialog open={isAddSectionOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Section</DialogTitle>
                  <DialogDescription>
                    Create a new section for your form. Sections help organize questions into logical groups.
                  </DialogDescription>
                </DialogHeader>

                {sectionError && (
                  <div
                    className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300"
                    role="alert"
                  >
                    {sectionError}
                  </div>
                )}

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="section-title">Section Title</Label>
                    <Input
                      id="section-title"
                      placeholder="Enter section title"
                      value={sectionTitle}
                      onChange={(e) => setSectionTitle(e.target.value)}
                      disabled={isCreatingSection}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isCreatingSection) {
                          e.preventDefault();
                          handleAddSection();
                        }
                      }}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleDialogOpenChange(false)}
                    disabled={isCreatingSection}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddSection} disabled={!isCreatingSection}>
                    {isCreatingSection ? "Adding..." : "Add Section"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {formCycle.sections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No sections yet</p>
              <p className="text-sm text-muted-foreground">
                Click "Add Section" to create your first section
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {formCycle.sections
                .sort((a, b) => a.display_order - b.display_order)
                .map((section: FormDetailSection) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {section.title || "Untitled Section"}
                          </CardTitle>
                          <CardDescription>
                            {section.questions.length} question{section.questions.length !== 1 ? "s" : ""}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">Order {section.display_order}</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FormEdit;
