import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ROUTES, getFormCycleDetailsRoute } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  MoreVerticalIcon,
  TrashIcon,
  CopyIcon,
  SearchIcon,
  LoaderIcon,
} from "lucide-react";
import { CreateFormModal } from "@/components/CreateFormModal";
import { useAssignedForms } from "@/hooks/useAssignedForms";
import { debugAuthState } from "@/utils/debugAuth";

// Form type definition
type FormItem = {
  id: string;
  name: string;
  description: string;
  status: "active" | "draft" | "archived";
  submissions: number | null; // null when count is unavailable from API
  createdAt: string;
  updatedAt: string;
};

function Forms() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch assigned forms from API
  const { data: assignedForms, isLoading, isError, error, refetch, isUnauthenticated } = useAssignedForms();

  // Debug authentication on mount and when error occurs
  useEffect(() => {
    if (isUnauthenticated && import.meta.env.DEV) {
      console.log('⚠️ Forms query disabled: No valid user ID found in token');
      // Run debug utility to help diagnose authentication issues
      debugAuthState();
    } else if (isError && import.meta.env.DEV) {
      // Sanitize error to avoid exposing sensitive headers in console
      // Only log status and message, not the full error object which may contain auth headers
      const sanitizedError = {
        message: error?.message || 'Unknown error',
        status: error?.status,
      };
      console.log('❌ Error fetching forms:', sanitizedError);
      // Run debug utility to help diagnose the issue
      debugAuthState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnauthenticated, isError]); // Intentionally omit 'error' to prevent noisy re-runs when error object identity changes

  // Map submission_status from API to display status
  const mapSubmissionStatusToFormStatus = (submission_status: string | null): FormItem["status"] => {
    // Map API submission_status values to UI display status
    switch (submission_status) {
      case "in_progress":
        return "active";
      case "draft":
        return "draft";
      case "submitted":
      case "completed":
        return "archived";
      default:
        // Default to "draft" for null or any unknown status
        return "draft";
    }
  };

  /**
   * Safely format ISO 8601 date string to YYYY-MM-DD without timezone conversion
   * Avoids UTC conversion that can shift dates by ±1 day around midnight
   * @param isoDateString - ISO 8601 date string (e.g., "2026-06-30T23:59:59+00:00")
   * @returns Formatted date string (YYYY-MM-DD) or fallback value on error
   */
  const formatDateSafe = (isoDateString: string | null | undefined, fallback = "N/A"): string => {
    if (!isoDateString) return fallback;

    try {
      // Extract just the date part (YYYY-MM-DD) from ISO string
      // This avoids timezone conversion issues with toISOString()
      // Example: "2026-06-30T23:59:59+00:00" -> "2026-06-30"
      const match = isoDateString.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) {
        return match[1];
      }

      // Fallback: try parsing as Date and format manually using UTC to avoid timezone conversion
      const date = new Date(isoDateString);
      if (isNaN(date.getTime())) {
        if (import.meta.env.DEV) {
          console.warn(`Invalid date string: ${isoDateString}`);
        }
        return fallback;
      }

      // Format manually using UTC methods to avoid timezone conversion
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(`Error formatting date: ${isoDateString}`, error);
      }
      return fallback;
    }
  };

  // Map API response to FormItem type for display
  const forms: FormItem[] = assignedForms?.map((form) => ({
    id: form.id,
    name: form.title,
    description: form.description || "",
    status: mapSubmissionStatusToFormStatus(form.submission_status),
    submissions: null, // API doesn't provide submissions count yet - null indicates unavailable
    // API only provides submission_deadline, not created_at/updated_at
    // Using "N/A" for createdAt since backend doesn't provide it
    // updatedAt is populated with deadline to display in the "Deadline" column
    createdAt: "N/A",
    updatedAt: formatDateSafe(form.submission_deadline),
  })) || [];

  // Filter forms based on search
  const filteredForms = forms.filter(
    (form) =>
      form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteForm = (id: string) => {
    // TODO: Implement delete API call
    toast.success("Form deleted successfully!");
    refetch();
  };

  const handleDuplicateForm = (form: FormItem) => {
    // TODO: Implement duplicate API call
    toast.success("Form duplicated successfully!");
    refetch();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- formData required by CreateFormModal interface
  const handleCreateForm = (formData: { id: string; status: string }) => {
    // Refetch the assigned forms list after successful form cycle creation
    refetch();
  };

  const getStatusBadge = (status: FormItem["status"]) => {
    const variants: Record<FormItem["status"], { variant: "default" | "secondary" | "outline"; label: string }> = {
      active: { variant: "default", label: "Active" },
      draft: { variant: "secondary", label: "Draft" },
      archived: { variant: "outline", label: "Archived" },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Forms Management</h1>
          <p className="text-muted-foreground">
            Create and manage your forms
          </p>
        </div>

        {/* Create Form Modal */}
        <CreateFormModal onFormCreated={handleCreateForm} />
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Forms</CardTitle>
          <CardDescription>
            {filteredForms.length} form{filteredForms.length !== 1 ? "s" : ""}{" "}
            {searchQuery && "found"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Submissions</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="w-17.5">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isUnauthenticated ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-destructive">
                      <p className="font-medium mb-2">Authentication Required</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        You must be logged in to view assigned forms. Please sign in to continue.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(ROUTES.SIGN_IN)}
                      >
                        Sign In
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <LoaderIcon className="h-5 w-5 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading forms...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-destructive">
                      <p className="font-medium mb-2">Error loading forms</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {error?.message || "An unexpected error occurred"}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                      >
                        Try Again
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredForms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "No forms found matching your search."
                        : "No forms yet. Create your first form to get started."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredForms.map((form) => (
                  <TableRow
                    key={form.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(getFormCycleDetailsRoute(form.id))}
                  >
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {form.description}
                    </TableCell>
                    <TableCell>{getStatusBadge(form.status)}</TableCell>
                    <TableCell className="text-right">
                      {form.submissions !== null ? form.submissions : "N/A"}
                    </TableCell>
                    <TableCell>{form.updatedAt}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Form actions menu">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDuplicateForm(form)}
                          >
                            <CopyIcon className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteForm(form.id)}
                            variant="destructive"
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default Forms;
