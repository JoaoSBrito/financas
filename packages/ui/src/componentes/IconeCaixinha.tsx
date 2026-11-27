"use client";

import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";

/** Porquinho (ícone "caixinha" do Design System): só traço, como os demais ícones. */
export function IconeCaixinha(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 12.5c0-3.6 3.4-6 7.5-6 2.3 0 4.2.7 5.5 1.9H19l1 2.4v2.6l-1.6.6c-.4 1-1 1.9-1.9 2.6V19h-2.6v-1.3c-.9.2-1.9.3-2.9.3s-2-.1-2.9-.4V19H5.5v-2.4c-.6-1.1-1-2.6-1-4.1z" />
        <path d="M10 8.6h3.2" />
        <path d="M4.5 12.2c-1.2 0-1.9-.8-1.9-1.7" />
      </g>
      <circle cx="16.3" cy="11.2" r="0.7" fill="currentColor" />
    </SvgIcon>
  );
}
