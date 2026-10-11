import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import CheckoutPage from "./CheckoutPage";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/register" element={<div>register-page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CheckoutPage routing", () => {
  it("redirects an unknown plan to registration", () => {
    renderAt("/checkout?plan=nope&billing=annual");
    expect(screen.getByText("register-page")).toBeInTheDocument();
  });

  it("redirects the free plan to registration (nothing to pay)", () => {
    renderAt("/checkout?plan=free&billing=monthly");
    expect(screen.getByText("register-page")).toBeInTheDocument();
  });
});

describe("CheckoutPage summary", () => {
  it("shows the annual total for a paid plan", () => {
    renderAt("/checkout?plan=premium&billing=annual");
    expect(screen.getByText(/order summary/i)).toBeInTheDocument();
    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.getAllByText("€19.00").length).toBeGreaterThan(0);
  });

  it("falls back to annual billing when the cycle is invalid", () => {
    renderAt("/checkout?plan=premium&billing=weird");
    expect(screen.getAllByText("€19.00").length).toBeGreaterThan(0);
  });

  it("shows the monthly price when billed monthly", () => {
    renderAt("/checkout?plan=premium&billing=monthly");
    expect(screen.getAllByText("€1.99").length).toBeGreaterThan(0);
  });
});

describe("CheckoutPage demo payment", () => {
  it("shows a success state after submitting the demo form", async () => {
    renderAt("/checkout?plan=premium&billing=annual");

    await userEvent.type(
      screen.getByLabelText(/cardholder name/i),
      "Ada Lovelace",
    );
    await userEvent.type(
      screen.getByLabelText(/email for the receipt/i),
      "ada@example.com",
    );
    await userEvent.click(screen.getByRole("button", { name: /pay/i }));

    expect(screen.getByText(/payment successful/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create your vault/i }),
    ).toBeInTheDocument();
  });
});
