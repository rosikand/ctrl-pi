import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { primaryNavigation } from "./navigation";
import { AppRoutes } from "./router";

const expectedPrimaryLabels = [
  "Arms",
  "Record / Teleop",
  "Datasets",
  "Training",
  "Inference",
];

function renderRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe("ctrl-π application shell", () => {
  it("defines exactly the five required primary destinations", () => {
    expect(primaryNavigation.map((item) => item.label)).toEqual(
      expectedPrimaryLabels,
    );
  });

  it("redirects the root route to Arms and renders one five-item primary nav", async () => {
    renderRoute("/");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Arms" }),
    ).toBeInTheDocument();

    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    const links = within(primaryNav).getAllByRole("link");

    expect(links).toHaveLength(5);
    expect(links.map((link) => link.getAttribute("aria-label"))).toEqual(
      expectedPrimaryLabels,
    );
    expect(
      within(primaryNav).getByRole("link", { name: "Arms" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("navigates between primary views and keeps Training subviews secondary", async () => {
    const user = userEvent.setup();
    renderRoute("/arms");

    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    await user.click(
      within(primaryNav).getByRole("link", { name: "Datasets" }),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Datasets" }),
    ).toBeInTheDocument();

    await user.click(
      within(primaryNav).getByRole("link", { name: "Training" }),
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Training" }),
    ).toBeInTheDocument();

    const trainingNav = screen.getByRole("navigation", {
      name: "Training views",
    });
    expect(within(trainingNav).getAllByRole("link")).toHaveLength(2);
    expect(
      within(trainingNav).getByRole("link", { name: "Runs" }),
    ).toHaveAttribute("aria-current", "page");

    await user.click(
      within(trainingNav).getByRole("link", { name: "Models" }),
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Model repositories" }),
    ).toBeInTheDocument();
    expect(within(primaryNav).getAllByRole("link")).toHaveLength(5);
    expect(
      within(primaryNav).getByRole("link", { name: "Training" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("renders a safe not-found state without changing primary navigation", () => {
    renderRoute("/not-a-real-view");

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "Primary" })).getAllByRole(
        "link",
      ),
    ).toHaveLength(5);
  });
});
