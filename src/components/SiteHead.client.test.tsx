// @vitest-environment happy-dom
//
// <SiteHead> dans le navigateur : le suivi attend que le jeton d'aperçu et le
// cache soient lus (browserStateApplied). Avant, au premier rendu
// (hydratation), l'adresse porte encore ?preview=<jeton> et une page vue
// partirait avec lui ; lib/preview.ts ne le retire qu'à cette lecture.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteContentContext } from "../hooks/site-content-context";
import type { UseSiteContentResult } from "../hooks/useSiteContent";
import { injectTrackingIfConsented } from "../lib/tracking";
import type { SiteContent } from "../types/site-content";
import { SiteHead } from "./SiteHead";

vi.mock("../lib/tracking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/tracking")>()),
  injectTrackingIfConsented: vi.fn(),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CONTENT: SiteContent = {
  site: { name: "Plomberie Martin", domains: ["plomberie-martin.fr"], settings: { gtmId: "GTM-TEST000" }, publishedAt: "2026-09-25T11:12:30.331Z" },
  sections: {},
  articles: [],
};
const PATH = "/blog";
const TITLE = "Blog";
/** Prérendu et hydratation : l'instantané seul, rien du navigateur encore lu. */
const HYDRATING: UseSiteContentResult = { content: CONTENT, isPreview: false, isFresh: false, previewToken: null, source: "snapshot", browserStateApplied: false };

let root: Root | null = null;
let container: HTMLElement;

function render(context: UseSiteContentResult) {
  root!.render(
    <MemoryRouter initialEntries={[PATH]}>
      <SiteContentContext.Provider value={context}>
        <SiteHead title={TITLE} settings={context.content.site.settings} />
      </SiteContentContext.Provider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(injectTrackingIfConsented).mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  container.remove();
});

describe("SiteHead dans le navigateur : suivi après la lecture du navigateur", () => {
  it("rien tant que browserStateApplied est faux, puis une page vue, avec le chemin", async () => {
    await act(async () => render(HYDRATING));
    expect(injectTrackingIfConsented).not.toHaveBeenCalled();

    await act(async () => render({ ...HYDRATING, isPreview: true, previewToken: "jeton-apercu", browserStateApplied: true }));
    expect(injectTrackingIfConsented).toHaveBeenCalledTimes(1);
    expect(injectTrackingIfConsented).toHaveBeenCalledWith(CONTENT.site.settings, PATH);
  });
});
