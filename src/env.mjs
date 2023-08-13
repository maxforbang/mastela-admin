import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    HA_TOKEN_VILLA_AVIATOR: z.string(),
    HA_TOKEN_VILLA_ENCORE: z.string(),
    HA_TOKEN_THE_TWINS_VILLA: z.string(),
    HA_TOKEN_MAYA_SERENITY: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    HA_TOKEN_VILLA_AVIATOR: process.env.HA_TOKEN_VILLA_AVIATOR,
    HA_TOKEN_VILLA_ENCORE: process.env.HA_TOKEN_VILLA_ENCORE,
    HA_TOKEN_THE_TWINS_VILLA: process.env.HA_TOKEN_THE_TWINS_VILLA,
    HA_TOKEN_MAYA_SERENITY: process.env.HA_TOKEN_MAYA_SERENITY,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
