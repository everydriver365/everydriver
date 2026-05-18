/**
 * Smoke test: every V3 settings slug + every legacy alias must resolve
 * to a known AreaItem and render its DetailView (title + breadcrumb)
 * without throwing.
 *
 * `useAreaSections` is mocked to return [] so we don't pull in the full
 * editor tree (which would need Supabase). This isolates the test to
 * routing/resolution + DetailView layout — exactly the surface where the
 * "complete mess / falls back to Profile" bug class lives.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("@/components/instructor/settings/v3/areas", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../areas")>();
  return { ...actual, useAreaSections: () => [] };
});

import { SettingsShellV3 } from "../SettingsShellV3";
import { AREA_GROUPS, LEGACY_ID_MAP, ALL_ITEM_IDS } from "../areas";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/instructor/settings/:categoryId"
          element={<SettingsShellV3 instructorId="test-instructor" />}
        />
        <Route
          path="/instructor/settings"
          element={<SettingsShellV3 instructorId="test-instructor" />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

// Build the expected (slug, title, groupLabel) tuples for every canonical
// area item.
const canonicalCases = AREA_GROUPS.flatMap((g) =>
  g.items.map((i) => ({
    slug: i.id,
    title: i.title ?? i.label,
    groupLabel: g.label,
    label: i.label,
  })),
);

// Legacy aliases map to a canonical item — pick its expected title.
const legacyCases = Object.entries(LEGACY_ID_MAP).map(([alias, target]) => {
  const item = AREA_GROUPS.flatMap((g) => g.items).find((i) => i.id === target);
  if (!item) throw new Error(`LEGACY_ID_MAP target "${target}" not in AREA_GROUPS`);
  const group = AREA_GROUPS.find((g) => g.items.some((i) => i.id === target));
  return {
    alias,
    targetSlug: target,
    title: item.title ?? item.label,
    groupLabel: group!.label,
    label: item.label,
  };
});

describe("SettingsShellV3 — slug resolution smoke test", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  beforeAll(() => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterAll(() => {
    errSpy.mockRestore();
  });

  it("AREA_GROUPS / ALL_ITEM_IDS stay in sync", () => {
    const idsFromGroups = new Set(
      AREA_GROUPS.flatMap((g) => g.items.map((i) => i.id)),
    );
    expect([...idsFromGroups].sort()).toEqual([...ALL_ITEM_IDS].sort());
    expect(idsFromGroups.size).toBeGreaterThan(10);
  });

  it.each(canonicalCases)(
    "canonical slug '$slug' renders title '$title' under group '$groupLabel'",
    ({ slug, title, label, groupLabel }) => {
      const { getByText, getByRole } = renderAt(`/instructor/settings/${slug}`);
      // Hero h1 = item.title
      expect(getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
      // Breadcrumb contains group label and the item label
      expect(getByText(groupLabel)).toBeInTheDocument();
      // aria-current="page" carries the leaf label
      const leaf = document.querySelector('[aria-current="page"]');
      expect(leaf?.textContent).toBe(label);
      cleanup();
    },
  );

  it.each(legacyCases)(
    "legacy alias '$alias' resolves to '$targetSlug' ('$title')",
    ({ alias, title }) => {
      const { getByRole } = renderAt(`/instructor/settings/${alias}`);
      expect(getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
      cleanup();
    },
  );

  it("unknown slug falls back to the landing grid (no crash)", () => {
    const { getByPlaceholderText } = renderAt(
      "/instructor/settings/this-slug-does-not-exist",
    );
    // Landing has the search input
    expect(getByPlaceholderText("Search settings")).toBeInTheDocument();
    cleanup();
  });

  it("bare /instructor/settings renders landing", () => {
    const { getByPlaceholderText, getByText } = renderAt("/instructor/settings");
    expect(getByPlaceholderText("Search settings")).toBeInTheDocument();
    expect(getByText(/Manage your profile/i)).toBeInTheDocument();
  });
});
