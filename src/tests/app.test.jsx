import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../App";

// Smoke test: la app completa monta sin errores y muestra el catálogo.
describe("App (smoke test)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renderiza el home con el catálogo y el header", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: /huertohogar/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /del campo a tu hogar/i })).toBeInTheDocument();
    expect(screen.getByText(/nuestros productos/i)).toBeInTheDocument();
    expect(screen.getByText("Manzanas Fuji")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cart \(0\)/i })).toBeInTheDocument();
  });
});
