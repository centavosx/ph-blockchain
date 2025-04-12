import { z } from 'zod';

export const envSchema = z.object({
  SESSION_SECRET_KEY: z.string().nonempty(),
  NEXT_PUBLIC_BASE_API_URL: z.string().default('http://localhost:3002'),
  NEXT_PUBLIC_WS_API_URL: z.string().default('ws://localhost:3002'),
  SERVER_USER_AGENT: z.string().nonempty(),
});
