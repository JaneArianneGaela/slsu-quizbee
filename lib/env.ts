import "server-only";
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  QM_PASSWORD: z.string().min(4),
  SESSION_SECRET: z.string().min(16),
});

export const env = schema.parse(process.env);