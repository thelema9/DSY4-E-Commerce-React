import {
  esEmailValido,
  esNombreValido,
  esPasswordValida,
  esTelefonoValido,
  validarProducto,
  validarRegistro,
} from "../utils/validaciones";

describe("Validaciones: esEmailValido", () => {
  it("acepta un correo válido", () => {
    expect(esEmailValido("ana@correo.com")).toBeTrue();
  });

  it("ignora espacios al inicio y al final", () => {
    expect(esEmailValido("  ana@correo.com  ")).toBeTrue();
  });

  it("rechaza un correo sin @", () => {
    expect(esEmailValido("anacorreo.com")).toBeFalse();
  });

  it("rechaza un correo sin dominio", () => {
    expect(esEmailValido("ana@correo")).toBeFalse();
  });

  it("rechaza un correo vacío", () => {
    expect(esEmailValido("")).toBeFalse();
  });
});

describe("Validaciones: esNombreValido", () => {
  it("acepta letras, tildes y espacios", () => {
    expect(esNombreValido("Ana Pérez Núñez")).toBeTrue();
  });

  it("rechaza nombres con números", () => {
    expect(esNombreValido("Ana123")).toBeFalse();
  });

  it("rechaza nombres de más de 50 caracteres", () => {
    expect(esNombreValido("a".repeat(51))).toBeFalse();
  });
});

describe("Validaciones: esPasswordValida", () => {
  it("acepta una contraseña fuerte", () => {
    expect(esPasswordValida("Clave123!")).toBeTrue();
  });

  it("rechaza una contraseña sin símbolo", () => {
    expect(esPasswordValida("Clave1234")).toBeFalse();
  });

  it("rechaza una contraseña sin mayúscula", () => {
    expect(esPasswordValida("clave123!")).toBeFalse();
  });

  it("rechaza una contraseña de menos de 8 caracteres", () => {
    expect(esPasswordValida("C1!a")).toBeFalse();
  });
});

describe("Validaciones: esTelefonoValido", () => {
  it("acepta un móvil chileno sin prefijo", () => {
    expect(esTelefonoValido("912345678")).toBeTrue();
  });

  it("acepta un móvil chileno con +56 y espacios", () => {
    expect(esTelefonoValido("+56 9 1234 5678")).toBeTrue();
  });

  it("rechaza un número corto", () => {
    expect(esTelefonoValido("12345")).toBeFalse();
  });

  it("rechaza un campo vacío", () => {
    expect(esTelefonoValido("")).toBeFalse();
  });
});

describe("Validaciones: validarRegistro", () => {
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

  it("permite omitir el teléfono (es opcional)", () => {
    expect(validarRegistro({ ...valido, telefono: "" })).toEqual({});
  });

  it("marca error si los correos no coinciden", () => {
    const errores = validarRegistro({ ...valido, confirmarEmail: "otro@correo.com" });
    expect(errores.confirmarEmail).toBe("Los correos no coinciden.");
  });

  it("marca error si las contraseñas no coinciden", () => {
    const errores = validarRegistro({ ...valido, confirmarPassword: "OtraClave1!" });
    expect(errores.confirmarPassword).toBe("Las contraseñas no coinciden.");
  });

  it("marca error si la contraseña no cumple el formato", () => {
    const errores = validarRegistro({ ...valido, password: "debil", confirmarPassword: "debil" });
    expect(errores.password).toBeDefined();
  });

  it("marca error si el teléfono tiene formato inválido", () => {
    const errores = validarRegistro({ ...valido, telefono: "12345" });
    expect(errores.telefono).toContain("móvil chileno");
  });

  it("marca error si faltan región y comuna", () => {
    const errores = validarRegistro({ ...valido, region: "", comuna: "" });
    expect(errores.region).toBe("Selecciona una región.");
    expect(errores.comuna).toBe("Selecciona una comuna.");
  });
});

describe("Validaciones: validarProducto", () => {
  it("devuelve vacío con un producto válido", () => {
    const producto = { nombre: "Palta Hass", categoria: "Frutas Frescas", precio: 2000, unidad: "kilo" };
    expect(validarProducto(producto)).toEqual({});
  });

  it("exige nombre, categoría, precio y unidad", () => {
    const errores = validarProducto({ nombre: "", categoria: "", precio: "", unidad: "" });
    expect(Object.keys(errores).sort()).toEqual(["categoria", "nombre", "precio", "unidad"]);
  });

  it("rechaza precios cero o negativos", () => {
    const base = { nombre: "A", categoria: "B", unidad: "kilo" };
    expect(validarProducto({ ...base, precio: 0 }).precio).toBeDefined();
    expect(validarProducto({ ...base, precio: -5 }).precio).toBeDefined();
  });
});
