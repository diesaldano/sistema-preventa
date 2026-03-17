import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DIEZ PRODUCCIONES - Preventa Oficial",
  description: "Preventa oficial de bebidas - Sistema de compra digital rápido y seguro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${montserrat.variable} antialiased bg-slate-950 text-slate-100`}
      >
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
