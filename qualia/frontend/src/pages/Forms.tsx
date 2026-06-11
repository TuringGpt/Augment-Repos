import { useState } from "react";
import { toast } from "sonner";
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
} from "lucide-react";
import { CreateFormModal } from "@/components/CreateFormModal";

// Form type definition
type FormItem = {
  id: string;
  name: string;
  description: string;
  status: "active" | "draft" | "archived";
  submissions: number;
  createdAt: string;
  updatedAt: string;
};

// Mock data - replace with API calls
const mockForms: FormItem[] = [
  {
    id: "1",
    name: "Customer Feedback Survey",
    description: "Collect customer satisfaction and feedback",
    status: "active",
    submissions: 234,
    createdAt: "2026-05-15",
    updatedAt: "2026-06-05",
  },
  {
    id: "2",
    name: "Employee Onboarding Form",
    description: "New employee information and documentation",
    status: "active",
    submissions: 45,
    createdAt: "2026-04-20",
    updatedAt: "2026-06-01",
  },
  {
    id: "3",
    name: "Product Registration",
    description: "Register purchased products for warranty",
    status: "draft",
    submissions: 0,
    createdAt: "2026-06-08",
    updatedAt: "2026-06-08",
  },
  {
    id: "4",
    name: "Support Ticket Request",
    description: "Customer support and issue tracking",
    status: "active",
    submissions: 567,
    createdAt: "2026-03-10",
    updatedAt: "2026-06-07",
  },
  {
    id: "5",
    name: "Event Registration",
    description: "Register for company events and webinars",
    status: "archived",
    submissions: 189,
    createdAt: "2026-02-01",
    updatedAt: "2026-05-30",
  },
];

function Forms() {
  const [forms, setForms] = useState<FormItem[]>(mockForms);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter forms based on search
  const filteredForms = forms.filter(
    (form) =>
      form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteForm = (id: string) => {
    setForms((prevForms) => prevForms.filter((form) => form.id !== id));
    toast.success("Form deleted successfully!");
  };

  const handleDuplicateForm = (form: FormItem) => {
    const duplicatedForm: FormItem = {
      ...form,
      id: String(Date.now()),
      name: `${form.name} (Copy)`,
      submissions: 0,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setForms((prevForms) => [duplicatedForm, ...prevForms]);
    toast.success("Form duplicated successfully!");
  };

  const handleCreateForm = (formData: { name: string; description?: string }) => {
    const newForm: FormItem = {
      id: String(Date.now()),
      name: formData.name,
      description: formData.description || "",
      status: "draft",
      submissions: 0,
      createdAt: new Date().toISOString().split("-")[0],
      updatedAt: new Date().toISOString().split("-")[0],
    };

    setForms((prevForms) => [newForm, ...prevForms]);
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
        <CreateFormModal onFormCreated={handleCreateForm()} />
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
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[70px]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredForms.length === 0 ? (
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
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {form.description}
                    </TableCell>
                    <TableCell>{getStatusBadge(form.status)}</TableCell>
                    <TableCell className="text-right">
                      {form.submissions}
                    </TableCell>
                    <TableCell>{form.updatedAt}</TableCell>
                    <TableCell>
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
