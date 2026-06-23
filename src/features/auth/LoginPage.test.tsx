import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../store/authSlice";
import { LoginPage } from "./LoginPage";
import * as authService from "../../services/auth.service";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderWithStore(
  ui: ReactElement,
  preloadedState?: unknown,
  initialEntries: Array<string | { pathname: string; state?: unknown }> = [{ pathname: "/login", state: { from: { pathname: "/dashboard" } } }],
) {
  const testStore = configureStore({
    reducer: { auth: authReducer } as never,
    preloadedState: preloadedState as never,
  });

  return {
    store: testStore,
    ...render(
      <Provider store={testStore}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/login" element={ui} />
            <Route path="/dashboard" element={<div data-testid="route">/dashboard</div>} />
            <Route path="/agent" element={<div data-testid="route">/agent</div>} />
            <Route path="/" element={<div data-testid="route">/</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    ),
  };
}

beforeEach(() => {
  mockNavigate.mockReset();
});

describe("LoginPage", () => {
  it("validates the form fields", async () => {
    renderWithStore(<LoginPage />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it("updates auth state on successful login", async () => {
    vi.spyOn(authService, "login").mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresInSeconds: 900,
    });

    const { store } = renderWithStore(<LoginPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i, { selector: "input" }), "agent@example.com");
    await user.type(screen.getByLabelText(/password/i, { selector: "input" }), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
    expect(store.getState().auth.accessToken).toBe("access-token");
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });

  it("shows a generic error on login failure", async () => {
    vi.spyOn(authService, "login").mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized.",
    });

    renderWithStore(<LoginPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i, { selector: "input" }), "agent@example.com");
    await user.type(screen.getByLabelText(/password/i, { selector: "input" }), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/session expired, please log in/i)).toBeInTheDocument();
  });

  it("redirects to the intended route after login", async () => {
    vi.spyOn(authService, "login").mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresInSeconds: 900,
    });

    renderWithStore(<LoginPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i, { selector: "input" }), "agent@example.com");
    await user.type(screen.getByLabelText(/password/i, { selector: "input" }), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
  });

  it("redirects staff users to the agent workspace by default", async () => {
    vi.spyOn(authService, "login").mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresInSeconds: 900,
    });

    renderWithStore(<LoginPage />, undefined, [{ pathname: "/login" }]);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i, { selector: "input" }), "agent@example.com");
    await user.type(screen.getByLabelText(/password/i, { selector: "input" }), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/agent", { replace: true });
    });
  });
});
