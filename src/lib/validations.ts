import { z } from "zod";

export const generateSchema = z.object({
  companyName: z.string().min(1, "企業名は必須です"),
  jobTitle: z.string().min(1, "募集職種は必須です"),
  content: z.string().min(1, "業務内容は必須です"),
  salary: z.string().optional().default(""),
  location: z.string().optional().default(""),
  persona: z.string().optional().default(""),
});

export const consultationSchema = z.object({
  email: z.string().email("正しいメールアドレスを入力してください"),
  name: z.string().optional().default(""),
  companyName: z.string().optional().default(""),
  phone: z.string().min(1, "電話番号は必須です"),
  preferredTime: z.string().optional().default(""),
  agreed: z.literal(true, {
    error: "プライバシーポリシーへの同意が必要です",
  }),
  generationLogId: z.string().optional(),
});

export type GenerateInput = z.infer<typeof generateSchema>;
export type ConsultationInput = z.infer<typeof consultationSchema>;
