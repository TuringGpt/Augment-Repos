import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, CalendarIcon, UsersIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";

// Dummy data types
interface FormCycleDetails {
  id: string;
  title: string;
  description: text;
  status: "draft" | "active" | "completed" | "archived";
  submission_deadline: string;
  created_at: string;
  total_reviewers: number;
  completed_submissions: number;
  pending_submissions: number;
}

interface Submission {
  id: string;
  reviewer_email: string;
  status: "not_started" | "in_progress" | "submitted";
  started_at: string | null;
  submitted_at: string | null;
}

// Dummy data
const getDummyFormCycle = (id: string): FormCycleDetails => ({
  id,
  title: "Q2 2026 Quality Assurance Review",
  description: "Comprehensive quarterly review of team performance and quality standards. This cycle focuses on evaluating adherence to coding standards, documentation quality, and collaboration metrics.",
  status: "active",
  submission_deadline: "2026-06-30T23:59:59",
  created_at: "2026-06-01T09:00:00",
  total_reviewers: 12,
  completed_submissions: 7,
  pending_submissions: 5,
});

const getDummySubmissions = (): Submission[] => [
  {
    id: "sub-1",
    reviewer_name: "John Doe",
    reviewer_email: "john.doe@example.com",
    status: "submitted",
    started_at: "2026-06-10T10:30:00",
    submitted_at: "2026-06-12T14:20:00",
  },
  {
    id: "sub-2",
    reviewer_name: "Jane Smith",
    reviewer_email: "jane.smith@example.com",
    status: "submitted",
    started_at: "2026-06-11T08:15:00",
    submitted_at: "2026-06-13T16:45:00",
  },
  {
    id: "sub-3",
    reviewer_name: "Michael Johnson",
    reviewer_email: "michael.j@example.com",
    status: "in_progress",
    started_at: "2026-06-14T11:00:00",
    submitted_at: null,
  },
  {
    id: "sub-4",
    reviewer_name: "Emily Davis",
    reviewer_email: "emily.davis@example.com",
    status: "submitted",
    started_at: "2026-06-09T13:20:00",
    submitted_at: "2026-06-11T10:30:00",
  },
  {
    id: "sub-5",
    reviewer_name: "Robert Wilson",
    reviewer_email: "robert.w@example.com",
    status: "not_started",
    started_at: null,
    submitted_at: null,
  },
];

// Helper functions
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadge = (status: FormCycleDetails["status"]) => {
  const variants = {
    draft: { variant: "secondary" as const, label: "Draft" },
    active: { variant: "default" as const, label: "Active" },
    completed: { variant: "default" as const, label: "Completed" },
    archived: { variant: "outline" as const, label: "Archived" },
  };
  const { variant, label } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
};

const getSubmissionStatusBadge = (status: Submission["status"]) => {
  const variants = {
    not_started: { variant: "secondary" as const, label: "Not Started" },
    in_progress: { variant: "outline" as const, label: "In Progress" },
    submitted: { variant: "default" as const, label: "Submitted" },
  };
  const { variant, label } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
};

function FormCycleDetails() {
  const { id } = useParams<{ id: number }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Invalid form cycle ID</p>
      </div>
    );
  }

  const formCycle = getDummyFormCycle(id);
  const submissions = getDummySubmissions();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
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
          <p className="text-muted-foreground">{formCycle.description}</p>
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
            <div className="text-3xl font-bold">{formCycle.total_reviewers}</div>
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
            <div className="text-3xl font-bold">{formCycle.completed_submissions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formCycle.total_reviewers > 0
                ? `${Math.round((formCycle.completed_submissions / formCycle.total_reviewers) * 100)}% completion rate`
                : "No reviewers assigned"}
            </p>
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
            <div className="text-3xl font-bold">{formCycle.pending_submissions}</div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reviewer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Submitted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.reviewer_name}</TableCell>
                  <TableCell>{submission.reviewer_email}</TableCell>
                  <TableCell>{getSubmissionStatusBadge(submission.status)}</TableCell>
                  <TableCell>{formatDate(submission.started_at)}</TableCell>
                  <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default FormCycleDetails;
