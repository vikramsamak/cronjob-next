"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import { useState } from "react";
import {
  DEV_BASE_URL,
  EMAIL_FAILED_RESPONSE,
  EMAIL_SUCCESS_RESPONSE,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENT_SIZE_MB,
  PROD_BASE_URL,
} from "@/helpers/constants";
import { toast } from "sonner";

const formSchema = z.object({
  emailTo: z.string().email({ message: "Invalid email format" }),
  emailCc: z
    .string()
    .refine((value) => value === "" || z.string()?.email()?.check(value), {
      message: "Invalid email format",
    })
    .optional(),
  emailBcc: z
    .string()
    .refine((value) => value === "" || z.string()?.email()?.check(value), {
      message: "Invalid email format",
    })
    .optional(),
  emailSubject: z.string().min(1, { message: "Subject is required" }),
  emailText: z.string().min(1, { message: "Message is required" }),
  emailAttachments: z
    .any()
    .optional()
    .refine(
      (attachments) => {
        if (attachments) {
          const files = Array.from(attachments);
          const totalSize = files.reduce((acc, file) => acc + file.size, 0);
          return totalSize <= MAX_ATTACHMENT_SIZE_BYTES;
        }
        return true;
      },
      {
        message: `Total attachments size must not exceed ${MAX_ATTACHMENT_SIZE_MB} MB`,
      }
    ),
});

function EmailSendingForm() {
  const [isLoading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      emailTo: "",
      emailCc: "",
      emailBcc: "",
      emailSubject: "",
      emailAttachments: [],
      emailText: "",
    },
  });

  const fileRef = form.register("emailAttachments");

  const sendEmailData = async (emailData) => {
    try {
      setLoading(true);
      const baseUrl =
        process.env.NODE_ENV === "development" ? DEV_BASE_URL : PROD_BASE_URL;
      const resopnse = await fetch(`${baseUrl}/api/emailsender`, {
        method: "POST",
        body: emailData,
      });
      const res = await resopnse.json();
      if (res.msg === EMAIL_SUCCESS_RESPONSE) {
        toast.success(EMAIL_SUCCESS_RESPONSE);
      }
      if (res.error === EMAIL_FAILED_RESPONSE) {
        toast.error(EMAIL_FAILED_RESPONSE);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      form.reset();
    }
  };

  function onSubmit(values) {
    const formData = new FormData();
    formData.append("emailTo", values.emailTo);
    formData.append("emailCc", values.emailCc);
    formData.append("emailBcc", values.emailBcc);
    formData.append("emailSubject", values.emailSubject);
    formData.append("emailText", values.emailText);
    for (const attachment of Array.from(values.emailAttachments)) {
      formData.append("emailAttachments", attachment);
    }
    sendEmailData(formData);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-2 w-full h-full"
      >
        <div className="flex flex-wrap gap-2 w-full md:flex-nowrap">
          <FormField
            control={form.control}
            name="emailTo"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="font-mono uppercase tracking-wide">
                  To
                </FormLabel>
                <FormControl>
                  <Input placeholder="Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emailCc"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="font-mono uppercase tracking-wide">
                  Cc
                </FormLabel>
                <FormControl>
                  <Input placeholder="Cc" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emailBcc"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="font-mono uppercase tracking-wide">
                  Bcc
                </FormLabel>
                <FormControl>
                  <Input placeholder="Bcc" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="emailSubject"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-mono uppercase tracking-wide">
                Subject
              </FormLabel>
              <FormControl>
                <Input placeholder="Subject" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emailAttachments"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-mono uppercase tracking-wide">
                Attachments
              </FormLabel>
              <FormControl>
                <Input type="file" {...fileRef} multiple={true} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emailText"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-mono uppercase tracking-wide">
                Message
              </FormLabel>
              <FormControl>
                <Textarea
                  className="overflow-y-auto"
                  rows={8}
                  placeholder="Type your message here..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="font-mono uppercase tracking-wide">
          {isLoading ? "Sending..." : "Send"}
        </Button>
      </form>
    </Form>
  );
}

export default EmailSendingForm;
