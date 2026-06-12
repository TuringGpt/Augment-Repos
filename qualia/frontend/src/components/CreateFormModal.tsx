import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z, ZodError } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { useCreateFormCycle } from "@/hooks/useCreateFormCycle";

// Zod schema for create form validation
const createFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Form name is required" })
    .max(100, { message: "Form name must be at most 100 characters" }),
  description: z
    .string()
    .trim()
    .max(500, { message: "Description must be at most 500 characters" })
    .optional(),
  submission_deadline: z
    .string()
    .min(1, { message: "Submission deadline is required" })
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date > new Date();
      },
      { message: "Submission deadline must be a future date" }
    ),
});

type CreateFormData = z.infer<typeof createFormSchema>;

// Form field configuration
const formFields = [
  {
    name: "name" as const,
    label: "Form Name",
    type: "text" as const,
    placeholder: "Enter form name",
    required: true,
    validator: z
      .string()
      .trim()
      .min(1, { message: "Form name is required" })
      .max(100, { message: "Form name must be at most 100 characters" }),
  },
  {
    name: "description" as const,
    label: "Description",
    type: "textarea" as const,
    placeholder: "Enter form description (optional)",
    required: false,
    validator: z
      .string()
      .trim()
      .max(500, { message: "Description must be at most 500 characters" })
      .optional(),
  },
  {
    name: "submission_deadline" as const,
    label: "Submission Deadline",
    type: "datetime-local" as const,
    placeholder: "",
    required: true,
    validator: z
      .string()
      .min(1, { message: "Submission deadline is required" })
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime()) && date > new Date();
        },
        { message: "Submission deadline must be a future date" }
      ),
  },
] as const;

interface CreateFormModalProps {
  onFormCreated?: (formData: { id: string; status: string }) => void | Promise<void>;
}

export function CreateFormModal({ onFormCreated }: CreateFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string>("");

  const { mutate: createFormCycle, isPending } = useCreateFormCycle({
    onSuccess: async (data) => {
      toast.success("Form cycle created successfully!");
      form.reset();
      setIsOpen(false);

      // Handle async callbacks to prevent unhandled promise rejections
      try {
        await onFormCreated?.(data);
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : "An error occurred in the callback";
        console.error("Error in onFormCreated callback:", error);
        setError(errorMessage);
        toast.error("Error", {
          description: errorMessage,
        });
      }
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to create form cycle";
      setError(errorMessage);
      toast.error("Error", {
        description: errorMessage,
      });
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      submission_deadline: "",
    } as CreateFormData,
    onSubmit: async ({ value }) => {
      setError("");

      try {
        // Validate with Zod
        const validatedData = createFormSchema.parse(value);

        // Convert the datetime-local value to ISO 8601 format with timezone
        const deadlineDate = new Date(validatedData.submission_deadline);
        const isoDeadline = deadlineDate.toISOString();

        // Call the mutation to create form cycle
        createFormCycle({
          title: validatedData.name,
          description: validatedData.description || null,
          submission_deadline: isoDeadline,
        });
      } catch (err) {
        // Handle Zod validation errors
        if (err instanceof ZodError) {
          const issues = err.issues;
          const errorMessage = issues[0]?.message || "Validation failed";
          setError(errorMessage);
          toast.error("Validation Error", {
            description: errorMessage,
          });
        } else {
          // Handle unexpected errors
          const errorMessage =
            err instanceof Error ? err.message : "An unexpected error occurred";
          console.error("Form creation error:", err);
          setError(errorMessage);
          toast.error("Error", {
            description: errorMessage,
          });
        }
      }
    },
  });

  const handleCancel = () => {
    form.reset();
    setError("");
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Clear any stale errors when opening the dialog
      setError("");
    } else {
      // Reset form state when closing the dialog
      form.reset();
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Form
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Form</DialogTitle>
          <DialogDescription>
            Add a new form to your collection. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await form.handleSubmit();
          }}
        >
          {error && (
            <div
              className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300 mb-4"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="space-y-4 py-4">
            {formFields.map((fieldConfig) => (
              <form.Field
                key={fieldConfig.name}
                name={fieldConfig.name}
                validators={{
                  onChange: ({ value }) => {
                    const result = fieldConfig.validator.safeParse(value);
                    return result.success
                      ? undefined
                      : result.error.issues[0]?.message;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={fieldConfig.name}>
                      {fieldConfig.label}
                      {fieldConfig.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                    {fieldConfig.type === "textarea" ? (
                      <Textarea
                        id={fieldConfig.name}
                        name={field.name}
                        value={field.state.value as string}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          if (error) setError("");
                        }}
                        placeholder={fieldConfig.placeholder}
                        rows={3}
                      />
                    ) : (
                      <Input
                        type={fieldConfig.type}
                        id={fieldConfig.name}
                        name={field.name}
                        value={field.state.value as string}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          if (error) setError("");
                        }}
                        placeholder={fieldConfig.placeholder}
                        autoFocus={fieldConfig.name === "name"}
                      />
                    )}
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Form"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
