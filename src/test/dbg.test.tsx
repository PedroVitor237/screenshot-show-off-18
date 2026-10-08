import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";

it("debug index", async () => {
  const errs: any[] = [];
  vi.spyOn(console, "error").mockImplementation((...a) => errs.push(a.map(String).join(" ")));
  const queryClient = new QueryClient();
  const router = createRouter({ routeTree, context: { queryClient }, history: createMemoryHistory({ initialEntries: ["/"] }) });
  await router.load();
  console.log("state matches:", router.state.matches.map((m) => m.routeId));
  console.log("state status:", router.state.status, router.state.statusCode);
  render(<RouterProvider router={router} />);
  await waitFor(() => expect(document.body.textContent?.length).toBeGreaterThan(0), { timeout: 3000 });
  console.log("errors:", errs.slice(0, 5));
}, 10000);
