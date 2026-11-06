"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Estado de interface apenas. Dados do Supabase ficam no TanStack Query. */
interface Preferencias {
  ocultarValores: boolean;
  alternarOcultarValores: () => void;
  /** Como as parcelas do cartão entram na tela de Gastos. */
  baseGastos: "compra" | "fatura";
  definirBaseGastos: (base: "compra" | "fatura") => void;
}

export const usePreferencias = create<Preferencias>()(
  persist(
    (set) => ({
      ocultarValores: false,
      alternarOcultarValores: () => set((s) => ({ ocultarValores: !s.ocultarValores })),
      baseGastos: "compra",
      definirBaseGastos: (baseGastos) => set({ baseGastos }),
    }),
    { name: "financas-preferencias" },
  ),
);
