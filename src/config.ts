import { z } from "zod";

import type { Env } from "./types";

const teamDomainSchema = z.string().trim().url().transform((value, context) => {
  const url = new URL(value);
  if (url.protocol !== "https:" || (url.pathname !== "" && url.pathname !== "/") || url.search || url.hash) {
    context.addIssue({ code: "custom", message: "must be an HTTPS origin without a path" });
    return z.NEVER;
  }
  return url.origin;
});

const configSchema = z.object({
  COSENSE_PROJECT_NAME: z.string().trim().min(1).max(200),
  COSENSE_SID: z.string().min(1),
  CF_ACCESS_TEAM_DOMAIN: teamDomainSchema,
  CF_ACCESS_AUD: z.string().trim().min(1).max(500),
});

export interface AppConfig {
  projectName: string;
  cosenseSid: string;
  accessTeamDomain: string;
  accessAudience: string;
}

export function parseConfig(env: Env): AppConfig {
  const value = configSchema.parse(env);
  return {
    projectName: value.COSENSE_PROJECT_NAME,
    cosenseSid: value.COSENSE_SID,
    accessTeamDomain: value.CF_ACCESS_TEAM_DOMAIN,
    accessAudience: value.CF_ACCESS_AUD,
  };
}
