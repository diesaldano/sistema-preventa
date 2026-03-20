import type { Metadata } from "next";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

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
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('preventa-theme') || 'light';
                const html = document.documentElement;
                if (theme === 'dark') {
                  html.classList.add('dark');
                  html.classList.remove('light');
                } else {
                  html.classList.add('light');
                  html.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <CartProvider>{children}</CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
