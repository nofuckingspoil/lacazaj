import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Caza J — Nems fait-maison · Presqu'île de Guérande",
  description: "Commandez vos nems artisanaux (porc, poulet, crevette) et retirez-les chez Jenny à Saint-André-des-Eaux (44).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" style={{ background: "var(--cream)" }}>
      <body style={{ margin: 0, background: "var(--cream)", color: "var(--ink)" }}>
        {children}
      </body>
    </html>
  );
}
