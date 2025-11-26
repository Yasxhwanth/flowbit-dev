"use client";

import { useEffect } from "react";
import { CredentialType } from "@/generated/prisma/enums";
import { useParams, useRouter } from "next/navigation";
import {
  useCreateCredential,
  useSuspenseCredential,
  useUpdateCredential,
} from "../hooks/use-credentials";
import { useUpgradeModal } from "@/features/workflows/hooks/use-upgrade-modal";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

import {
  Form,
  FormControl,
  FormLabel,
  FormMessage,
  FormItem,
  FormField,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import Image from "next/image";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  type: z.enum(CredentialType),
  value: z.string().min(1, { message: "Value is required" }),
});

type FormValues = z.infer<typeof formSchema>;

const credentialTypeOptions = [
  {
    label: "OpenAI",
    logo: "/openai.svg",
    value: CredentialType.OPENAI,
  },
  {
    label: "Gemini",
    logo: "/gemini.svg",
    value: CredentialType.GEMINI,
  },
  {
    label: "Anthropic",
    logo: "/anthropic.svg",
    value: CredentialType.ANTHROPIC,
  },
];

interface CredentialFormProps {
  initialData?: {
    id?: string;
    name: string;
    type: CredentialType;
    value: string;
  };
}

export const CredentialForm = ({ initialData }: CredentialFormProps) => {
  const router = useRouter();

  const createCredential = useCreateCredential();
  const updateCredential = useUpdateCredential();
  const { handleError, modal } = useUpgradeModal();

  const isEdit = !!initialData?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: CredentialType.OPENAI,
      value: "",
    },
  });

  // Ensure form values are populated when editing an existing credential
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && initialData?.id) {
        await updateCredential.mutateAsync({
          id: initialData.id,
          ...values,
        });
      } else {
        await createCredential.mutateAsync(values, {
            onSuccess:(data)=>{
              router.push(`/credentials/${data.id}`);
            },
          onError: (error) => {
            handleError(error);
          },
        });
      }

      router.refresh();
      router.back();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {modal}

      <Card className="rounded-xl shadow-sm border">
        <CardHeader>
          <CardTitle>
            {isEdit ? "Edit Credential" : "Create Credential"}
          </CardTitle>

          <CardDescription>
            {isEdit
              ? "Update your API key or credential details"
              : "Add a new API key or credential to your account"}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My API key"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>

                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose provider" />
                        </SelectTrigger>

                        <SelectContent>
                          {credentialTypeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <Image
                                  src={opt.logo}
                                  alt={opt.label}
                                  width={18}
                                  height={18}
                                />
                                {opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* API Key */}
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" className="px-6">
                  {isEdit ? "Update" : "Create"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};


export const CredentialView = ({
    credentialId,
  }: {
    credentialId: string;
  }) => {
    const  credential  = useSuspenseCredential(credentialId);
  
    return <CredentialForm initialData={credential} />;
  };
