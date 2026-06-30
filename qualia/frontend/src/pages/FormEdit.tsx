import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, PlusIcon, AlertCircleIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ROUTES } from "@/config/routes";
import { useFormCycleById } from "@/hooks/useFormCycleById";
import { useCreateSection } from "@/hooks/useCreateSection";
import { useCreateQuestion } from "@/hooks/useCreateQuestion";
import { useDeleteQuestion } from "@/hooks/useDeleteQuestion";
import { usePublishFormCycle } from "@/hooks/usePublishFormCycle";
import { useQueryClient } from "@tanstack/react-query";
import type { FormDetailSection } from "@/services/formService";
import { QuestionType } from "@/services/formService";
import type { ApiError } from "@/lib/axios";

function FormEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionError, setSectionError] = useState("");

  // State for adding questions
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.SHORT_TEXT);
  const [isRequired, setIsRequired] = useState(false);
  const [questionError, setQuestionError] = useState("");

  // State for deleting questions
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<{
    questionId: string;
    sectionId: string;
    questionText: string;
  } | null>(null);

  // Capture the formCycleId at the time of mutation to avoid race conditions
  // if the user navigates to another form while the mutation is in-flight.
  // Use separate refs for section, question, and delete mutations to prevent one mutation
  // from overwriting the ref value while another is in-flight.
  const sectionMutationFormCycleIdRef = useRef<string | undefined>(undefined);
  const questionMutationFormCycleIdRef = useRef<string | undefined>(undefined);
  const deleteMutationFormCycleIdRef = useRef<string | undefined>(undefined);

  // Reset add-question state when the route param 'id' changes to prevent
  // cross-form state leakage (e.g., posting a question to a stale section ID)
  useEffect(() => {
    setIsAddQuestionOpen(false);
    setSelectedSectionId(null);
    setQuestionText("");
    setQuestionType(QuestionType.SHORT_TEXT);
    setIsRequired(false);
    setQuestionError("");
  }, [id]);

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
      // Use the captured formCycleId from the ref to avoid invalidating the wrong cache
      // if the route param changed while this mutation was in-flight
      if (sectionMutationFormCycleIdRef.current) {
        await queryClient.invalidateQueries({ queryKey: ["formCycle", sectionMutationFormCycleIdRef.current] });
      }
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to create section";
      setSectionError(errorMessage);
      toast.error("Error", {
        description: errorMessage,
      });
    },
  });

  // Create question mutation
  const { mutate: createQuestion, isPending: isCreatingQuestion } = useCreateQuestion({
    onSuccess: async () => {
      toast.success("Question added successfully!");
      setQuestionText("");
      setQuestionType(QuestionType.SHORT_TEXT);
      setIsRequired(false);
      setQuestionError("");
      setIsAddQuestionOpen(false);
      setSelectedSectionId(null);

      // Invalidate the form cycle query to refetch and show the new question
      if (questionMutationFormCycleIdRef.current) {
        await queryClient.invalidateQueries({ queryKey: ["formCycle", questionMutationFormCycleIdRef.current] });
      }
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to create question";
      setQuestionError(errorMessage);
      toast.error("Error", {
        description: errorMessage,
      });
    },
  });

  // Delete question mutation
  const { mutate: deleteQuestion, isPending: isDeletingQuestion } = useDeleteQuestion({
    onSuccess: async () => {
      toast.success("Question deleted successfully!");
      setIsDeleteDialogOpen(false);
      setQuestionToDelete(null);

      // Invalidate the form cycle query to refetch and update the UI
      // Use the captured formCycleId from the ref to avoid invalidating the wrong cache
      // if the route param changed while this mutation was in-flight
      if (deleteMutationFormCycleIdRef.current) {
        await queryClient.invalidateQueries({ queryKey: ["formCycle", deleteMutationFormCycleIdRef.current] });
      }
    },
    onError: (error: ApiError) => {
      const errorMessage = error.message || "Failed to delete question";
      toast.error("Error", {
        description: errorMessage,
      });
    },
  });

  // Publish form cycle mutation
  const { mutate: publishForm, isPending: isPublishing } = usePublishFormCycle({
    onSuccess: async (data) => {
      toast.success("Form cycle published successfully!", {
        description: `Status is now ${data.status}`,
      });
      // Invalidate form cycle query to refresh the status
      if (id) {
        await queryClient.invalidateQueries({ queryKey: ["formCycle", id] });
      }
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to publish form cycle";
      toast.error("Publish failed", {
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

    if (sectionTitle.trim().length > 255) {
      setSectionError("Section title must be at most 255 characters");
      return;
    }

    // Capture the formCycleId at mutation time to avoid race conditions
    // if the user navigates while the mutation is in-flight
    sectionMutationFormCycleIdRef.current = id;

    // Let the backend auto-assign display_order to avoid race conditions
    // across multiple tabs/users (omitting display_order triggers safe auto-assignment)
    createSection({
      formCycleId: id,
      data: {
        title: sectionTitle.trim(),
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

  const handleOpenAddQuestion = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setQuestionError("");
    setIsAddQuestionOpen(true);
  };

  const handleQuestionDialogOpenChange = (open: boolean) => {
    if (!open && isCreatingQuestion) {
      // Prevent closing while creating
      return;
    }
    setIsAddQuestionOpen(open);
    if (open) {
      setQuestionError("");
    } else {
      setQuestionText("");
      setQuestionType(QuestionType.SHORT_TEXT);
      setIsRequired(false);
      setQuestionError("");
      setSelectedSectionId(null);
    }
  };

  const handleAddQuestion = () => {
    setQuestionError("");

    if (!questionText.trim()) {
      setQuestionError("Question text is required");
      return;
    }

    if (!selectedSectionId) {
      setQuestionError("No section selected");
      return;
    }

    // Capture the formCycleId at mutation time to avoid race conditions
    questionMutationFormCycleIdRef.current = id;

    // Let the backend auto-assign display_order to avoid race conditions
    createQuestion({
      formCycleId: id,
      sectionId: selectedSectionId,
      data: {
        question_text: questionText.trim(),
        question_type: questionType,
        is_required: isRequired,
      },
    });
  };

  const handleOpenDeleteDialog = (questionId: string, sectionId: string, questionText: string) => {
    setQuestionToDelete({ questionId, sectionId, questionText });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!questionToDelete || !id) return;

    // Capture the formCycleId at mutation time to avoid race conditions
    deleteMutationFormCycleIdRef.current = id;

    deleteQuestion({
      formCycleId: id,
      sectionId: questionToDelete.sectionId,
      questionId: questionToDelete.questionId,
    });
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
        {formCycle.status === 'draft' && !formCycle.is_published && (
          <Button
            onClick={() => id && publishForm(id)}
            disabled={isPublishing}
          >
            <SendIcon className="w-4 h-4 mr-2" />
            {isPublishing ? "Publishing..." : "Publish Form"}
          </Button>
        )}
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
                      maxLength={255}
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
                  <Button onClick={handleAddSection} disabled={isCreatingSection}>
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
              {[...formCycle.sections]
                .sort((a, b) => a.display_order - b.display_order)
                .map((section: FormDetailSection) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {section.title || "Untitled Section"}
                          </CardTitle>
                          <CardDescription>
                            {section.questions.length} question{section.questions.length !== 1 ? "s" : ""}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Order {section.display_order}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAddQuestion(section.id)}
                          >
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Add Question
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {section.questions.length > 0 && (
                      <CardContent>
                        <div className="space-y-2">
                          {[...section.questions]
                            .sort((a, b) => a.display_order - b.display_order)
                            .map((question) => (
                              <div
                                key={question.id}
                                className="flex items-start justify-between p-3 border rounded-md"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {question.question_text}
                                    {question.is_required && (
                                      <span className="text-destructive ml-1">*</span>
                                    )}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {question.question_type.replace(/_/g, " ")}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Order {question.display_order}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => handleOpenDeleteDialog(question.id, section.id, question.question_text)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Question Dialog */}
      <Dialog open={isAddQuestionOpen} onOpenChange={handleQuestionDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>
              Create a new question for this section.
            </DialogDescription>
          </DialogHeader>

          {questionError && (
            <div
              className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300"
              role="alert"
            >
              {questionError}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question-text">
                Question Text
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="question-text"
                placeholder="Enter question text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                disabled={isCreatingQuestion}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreatingQuestion) {
                    e.preventDefault();
                    handleAddQuestion();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="question-type">
                Question Type
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Select
                value={questionType}
                onValueChange={(value) => setQuestionType(value as QuestionType)}
                disabled={isCreatingQuestion}
              >
                <SelectTrigger id="question-type" className="w-full">
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={QuestionType.SHORT_TEXT}>Short Text</SelectItem>
                  <SelectItem value={QuestionType.LONG_TEXT}>Long Text</SelectItem>
                  <SelectItem value={QuestionType.NUMBER}>Number</SelectItem>
                  <SelectItem value={QuestionType.SINGLE_CHOICE}>Single Choice</SelectItem>
                  <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
                  <SelectItem value={QuestionType.DROPDOWN}>Dropdown</SelectItem>
                  <SelectItem value={QuestionType.RATING}>Rating</SelectItem>
                  <SelectItem value={QuestionType.YES_NO_NA}>Yes/No/N/A</SelectItem>
                  <SelectItem value={QuestionType.FILE_UPLOAD}>File Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-required"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked === true)}
                disabled={isCreatingQuestion}
              />
              <Label
                htmlFor="is-required"
                className="text-sm font-normal cursor-pointer"
              >
                This question is required
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleQuestionDialogOpenChange(false)}
              disabled={isCreatingQuestion}
            >
              Cancel
            </Button>
            <Button onClick={handleAddQuestion} disabled={isCreatingQuestion}>
              {isCreatingQuestion ? "Adding..." : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Question Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question?
              {questionToDelete && (
                <span className="block mt-2 font-medium text-foreground">
                  "{questionToDelete.questionText}"
                </span>
              )}
              <span className="block mt-2">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingQuestion}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeletingQuestion}
            >
              {isDeletingQuestion ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default FormEdit;
