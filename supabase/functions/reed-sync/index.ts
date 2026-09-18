import { handleReedSync } from "./handler.ts";
Deno.serve((request: Request) =>
  handleReedSync(request, {
    token: Deno.env.get("UKTL_CRON_SECRET"),
    origin: Deno.env.get("UKTL_SITE_ORIGIN"),
  }),
);
