import { borrarClave, guardarClave, leerClave } from "../utils/storage";

describe("Utils: storage (localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("devuelve el valor por defecto si la clave no existe", () => {
    expect(leerClave("no_existe", [])).toEqual([]);
  });

  it("guarda y vuelve a leer un objeto como JSON", () => {
    guardarClave("prueba", { a: 1, b: [2, 3] });
    expect(leerClave("prueba", null)).toEqual({ a: 1, b: [2, 3] });
  });

  it("devuelve el valor por defecto si el JSON guardado está corrupto", () => {
    localStorage.setItem("prueba", "{esto no es json");
    expect(leerClave("prueba", "por defecto")).toBe("por defecto");
  });

  it("devuelve el valor por defecto si localStorage falla (mock que lanza error)", () => {
    spyOn(Storage.prototype, "getItem").and.throwError("almacenamiento bloqueado");
    expect(leerClave("prueba", "por defecto")).toBe("por defecto");
  });

  it("guardarClave serializa y delega en localStorage.setItem (spy)", () => {
    const setItem = spyOn(Storage.prototype, "setItem").and.callThrough();
    guardarClave("prueba", { a: 1 });
    expect(setItem).toHaveBeenCalledOnceWith("prueba", '{"a":1}');
  });

  it("borrarClave elimina la clave", () => {
    guardarClave("prueba", 1);
    borrarClave("prueba");
    expect(localStorage.getItem("prueba")).toBeNull();
  });
});
