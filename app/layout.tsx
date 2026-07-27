import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video Web | The Secret Books",
  description: "Private Venice AI image and video creator for The Secret Books."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
