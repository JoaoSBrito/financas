"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Estado de interface apenas. Dados do Supabase ficam no TanStack Query. */
interface Preferencias {
  ocultarValores: boolean;
  alternarOcultarValores: () => void;
}

export const usePreferencias = create<Preferencias>()(
  persist(
    (set) => ({
      ocultarValores: false,
      alternarOcultarValores: () => set((s) => ({ ocultarValores: !s.ocultarValores })),
    }),
    { name: "financas-preferencias" },
  ),
);
