import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("login exposes a separate account creation path", async () => {
  const login = await readFile(new URL("../app/login/page.tsx", import.meta.url), "utf8");
  const signup = await readFile(new URL("../app/signup/page.tsx", import.meta.url), "utf8");
  assert.match(login, /href="\/signup"/);
  assert.match(login, /basoul-signup-cta/);
  assert.match(signup, /supabase\.auth\.signUp/);
  assert.match(signup, /router\.replace\("\/onboarding"\)/);
  assert.doesNotMatch(signup, /createOwnedOrganization/);
});

test("signup route remains public through the global session gate", async () => {
  const template = await readFile(new URL("../app/template.tsx", import.meta.url), "utf8");
  assert.match(template, /"\/signup"/);
  assert.match(template, /PUBLIC_AUTH_PATHS\.has\(pathname\)/);
});

test("signup keeps identity creation separate and uses enumeration-safe confirmation copy", async () => {
  const signup = await readFile(new URL("../app/signup/page.tsx", import.meta.url), "utf8");
  assert.match(signup, /If this is a new email/);
  assert.match(signup, /already have an account/);
  assert.match(signup, /existing invitation is resolved first/);
  assert.doesNotMatch(signup, /organization_id/);
});

test("owner onboarding uses cascading country region and city selectors", async () => {
  const onboarding = await readFile(new URL("../app/onboarding/page.tsx", import.meta.url), "utf8");
  assert.match(onboarding, /level=countries/);
  assert.match(onboarding, /level: "cities"/);
  assert.match(onboarding, /changeCountry/);
  assert.match(onboarding, /changeRegion/);
  assert.match(onboarding, /<select required value=\{countryCode\}/);
  assert.match(onboarding, /value=\{region\}/);
  assert.match(onboarding, /value=\{city\}/);
});

test("owner can manage the organization profile after onboarding", async () => {
  const settingsPage = await readFile(new URL("../app/settings/organization/page.tsx", import.meta.url), "utf8");
  const settingsService = await readFile(new URL("../lib/organizations/settings.ts", import.meta.url), "utf8");
  const switcher = await readFile(new URL("../components/shell/workspace-switcher.tsx", import.meta.url), "utf8");
  assert.match(settingsService, /membership\.role !== "owner"/);
  assert.match(settingsService, /organization_profiles/);
  assert.match(settingsService, /\.update\(/);
  assert.match(settingsPage, /updateOrganizationProfileSettings/);
  assert.match(settingsPage, /level=countries/);
  assert.match(settingsPage, /level: "cities"/);
  assert.match(switcher, /\/settings\/organization/);
  assert.match(switcher, /role === "owner"/);
});

test("geography provider remains server-side and validates supported levels", async () => {
  const route = await readFile(new URL("../app/api/geography/route.ts", import.meta.url), "utf8");
  assert.match(route, /countriesnow\.space/);
  assert.match(route, /level === "countries"/);
  assert.match(route, /level === "cities"/);
  assert.match(route, /unsupported geography level/);
  assert.match(route, /Geography data is temporarily unavailable/);
});
