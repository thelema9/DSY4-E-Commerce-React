import { describe, expect, it } from "vitest";
import {
  esEmailValido,
  esNombreValido,
  esPasswordValida,
  esTelefonoValido,
  validarProducto,
  validarRegistro,
} from "../utils/validaciones";

describe("esEmailValido", () => {
  it("acepta un correo válido", () => {
    expect(esEmailValido("ana@correo.com")).toBe(true);
  });

  it("rechaza un correo sin @", () => {
    expect(esEmailValido("anacorreo.com")).toBe(false);
  });

  it("rechaza un correo vacío", () => {
    expect(esEmailValido("")).toBe(false);
  });
});

describe("esNombreValido", () => {
  it("acepta letras y espacios hasta 50 caracteres", () => {
    expect(esNombreValido("Ana Pérez")).toBe(true);
  });

  it("rechaza nombres con números", () => {
    expect(esNombreValido("Ana123")).toBe(false);
  });
});

describe("esPasswordValida", () => {
  it("acepta una contraseña fuerte", () => {
    expect(esPasswordValida("Clave123!")).toBe(true);
  });

  it("rechaza una contraseña sin símbolo", () => {
    expect(esPasswordValida("Clave1234")).toBe(false);
  });

  it("rechaza una contraseña corta", () => {
    expect(esPasswordValida("C1!a")).toBe(false);
  });
});

describe("esTelefonoValido", () => {
  it("acepta un móvil chileno sin prefijo", () => {
    expect(esTelefonoValido("912345678")).toBe(true);
  });

  it("acepta un móvil chileno con +56 y espacios", () => {
    expect(esTelefonoValido("+56 9 1234 5678")).toBe(true);
  });

  it("rechaza un teléfono inválido", () => {
    expect(esTelefonoValido("12345")).toBe(false);
  });

  it("campo vacío es inválido", () => {
    expect(esTelefonoValido("")).toBe(false);
  });
});

describe("validarRegistro", () => {
  const valido = {
    nombre: "Ana Pérez",
    email: "ana@correo.com",
    confirmarEmail: "ana@correo.com",
    password: "Clave123!",
    confirmarPassword: "Clave123!",
    telefono: "912345678",
    region: "Región Metropolitana de Santiago",
    comuna: "Santiago",
  };

  it("devuelve un objeto vacío cuando todo es válido", () => {
    expect(validarRegistro(valido)).toEqual({});
  });

  it("marca error si los correos no coinciden", () => {
    const errores = validarRegistro({ ...valido, confirmarEmail: "otro@correo.com" });
    expect(errores.confirmarEmail).toBe("Los correos no coinciden.");
  });

  it("marca error si las contraseñas no coinciden", () => {
    const errores = validarRegistro({ ...valido, confirmarPassword: "OtraClave1!" });
    expect(errores.confirmarPassword).toBe("Las contraseñas no coinciden.");
  });

  it("marca error si falta la región", () => {
    const errores = validarRegistro({ ...valido, region: "" });
    expect(errores.region).toBe("Selecciona una región.");
  });

  it("marca error si la contraseña no cumple el formato", () => {
    const errores = validarRegistro({ ...valido, password: "debil", confirmarPassword: "debil" });
    expect(errores.password).toBeDefined();
  });
});

describe("validarProducto", () => {
  it("devuelve vacío con un producto válido", () => {
    expect(
      validarProducto({
        nombre: "Palta Hass",
        categoria: "Frutas Frescas",
        precio: 2000,
        unidad: "kilo",
      })
    ).toEqual({});
  });

  it("exige nombre, categoría, precio y unidad", () => {
    const errores = validarProducto({ nombre: "", categoria: "", precio: "", unidad: "" });
    expect(errores.nombre).toBeDefined();
    expect(errores.categoria).toBeDefined();
    expect(errores.precio).toBeDefined();
    expect(errores.unidad).toBeDefined();
  });

  it("rechaza precios negativos o cero", () => {
    expect(validarProducto({ nombre: "A", categoria: "B", precio: 0, unidad: "kilo" }).precio).toBeDefined();
    expect(validarProducto({ nombre: "A", categoria: "B", precio: -5, unidad: "kilo" }).precio).toBeDefined();
  });
});
