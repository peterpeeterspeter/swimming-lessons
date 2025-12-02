import { describe, it, expect } from "vitest";

import type { OrganizationBranding } from "@calcom/features/ee/organizations/context/provider";

import { getNavigationItems } from "../Navigation";

describe("Navigation includes Swim link", () => {
  it("has /swim entry with swim_nav key", () => {
    const items = getNavigationItems(undefined as unknown as OrganizationBranding);
    const swim = items.find((i) => i.href === "/swim");
    expect(swim).toBeTruthy();
    expect(swim?.name).toBe("swim_nav");
  });
});
