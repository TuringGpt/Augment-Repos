import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, CalendarIcon, UsersIcon, FileTextIcon, AlertCircleIcon, ClockIcon, EditIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES, getFormCycleEditRoute } from "@/config/routes";
import { useFormCycleById } from "@/hooks/useFormCycleById";
import { useFormSubmissions } from "@/hooks/useFormSubmissions";
import { usePublishFormCycle } from "@/hooks/usePublishFormcycle";
import type { SubmissionStatus } from "@/services/formService";



// Helper functions
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: "secondary" | "default" | "outline", label: string }> = {
    draft: { variant: "secondary", label: "Draft" },
    active: { variant: "default", label: "Active" },
    completed: { variant: "default", label: "Completed" },
    archived: { variant: "outline", label: "Archived" },
  };
  const config = variants[status] || { variant: "secondary", label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getSubmissionStatusBadge = (status: SubmissionStatus) => {
  const variants: Record<string, { variant: "secondary" | "default" | "outline", label: string }> = {
    draft: { variant: "secondary", label: "Not Started" },
    started: { variant: "outline", label: "In Progress" },
    submitted: { variant: "default", label: "Submitted" },
  };
  const config = variants[status] || { variant: "secondary", label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

function FormCycleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch form cycle details
  const {
    data: formCycle,
    isLoading: isLoadingCycle,
    isError: isCycleError,
    error: cycleError
  } = useFormCycleById(id);

  // Fetch submissions for statistics (only if we have a valid ID)
  const {
    data: submissions,
    isLoading: isLoadingSubmissions,
    isError: isSubmissionsError,
    error: submissionsError
  } = useFormSubmissions(id || '', { enabled: !!id });

  // Publish form cycle mutation
  const { mutate: publishForm, isPending: isPublishing } = usePublishFormCycle({
    onSuccess: async (data) => {
      toast.success("Form cycle published successfully!", {
        description: `Status is now ${data.status}`,
      });
      // Invalidate form cycle query to refresh the status
      if (id) {
        await queryClient.invalidateQueries({ queryKey: {"formCycle", id} });
      }
    },
    onError: ({error}) => {
      const errorMessage = error.message || "Failed to publish form cycle";
      toast.success("Publish failed", {
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
  if (isLoadingCycle || isLoadingSubmissions) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8" />
          <p className="text-muted-foreground">Loading form cycle details...</p>
        </div>
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

  // Calculate submission statistics
  // If submissions query failed, set stats to null to indicate unavailable data
  const totalReviewers = isSubmissionsError ? null : (submissions?.length || 0);
  const completedSubmissions = isSubmissionsError ? null : ((submissions?.filter(s => s.status === 'submitted').length) ?? 0);
  const pendingSubmissions = isSubmissionsError ? null : (totalReviewers! - completedSubmissions!);

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={navigate(getFormCycleEditRoute(id))}
          >
            <EditIcon class="w-4 h-4 mr-2" />
            Edit Form
          </Button>
          {formCycle.status === 'draft' && !formCycle.is_published && (
            <Button
              onClick={() => id && publishForm(id)}
              disabled={true}
            >
              <SendIcon className="w-4 h-4 mr-2" />
              {isPublishing ? "Publishing..." : "Publish Form"}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reviewers
            </CardTitle>
            <UsersIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSubmissionsError ? (
              <div className="text-sm text-destructive flex items-center gap-1">
                <AlertCircleIcon className="w-4 h-4" />
                <span>Unavailable</span>
              </div>
            ) : (
              <div className="text-3xl font-bold">{totalReviewers}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <FileTextIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSubmissionsError ? (
              <div className="text-sm text-destructive flex items-center gap-1">
                <AlertCircleIcon className="w-4 h-4" />
                <span>Unavailable</span>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold">{completedSubmissions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalReviewers! > 0
                    ? `${Math.round((completedSubmissions! / totalReviewers!) * 100)}% completion rate`
                    : "No reviewers assigned"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <ClockIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSubmissionsError ? (
              <div className="text-sm text-destructive flex items-center gap-1">
                <AlertCircleIcon className="w-4 h-4" />
                <span>Unavailable</span>
              </div>
            ) : (
              <div className="text-3xl font-bold">{pendingSubmissions}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deadline
            </CardTitle>
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatDate(formCycle.submission_deadline)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            Track reviewer submissions and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmissionsError ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <AlertCircleIcon className="size-8 text-destructive" />
                <p className="text-sm text-destructive">{submissionsError?.message || "Failed to load submissions"}</p>
              </div>
            </div>
          ) : submissions && submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reviewer ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Submitted At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium font-mono text-xs">{submission.reviewer_id}</TableCell>
                    <TableCell>{submission.reviewer_email || 'N/A'}</TableCell>
                    <TableCell>{getSubmissionStatusBadge(submission.status)}</TableCell>
                    <TableCell>{formatDate(submission.started_at)}</TableCell>
                    <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No submissions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FormCycleDetails;
