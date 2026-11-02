"use client";

import { create } from "zustand";

/** Mensagem curta exibida na parte de baixo da tela (ex.: "Gasto salvo"). */
interface Avisos {
  mensagem: string | null;
  mostrar: (mensagem: string) => void;
  fechar: () => void;
}

export const useAvisos = create<Avisos>()((set) => ({
  mensagem: null,
  mostrar: (mensagem) => set({ mensagem }),
  fechar: () => set({ mensagem: null }),
}));
