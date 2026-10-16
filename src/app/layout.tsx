import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Instituto Inmaculada Concepción · Inglés",
    template: "%s · Instituto Inmaculada Concepción",
  },
  description:
    "Instituto de inglés Inmaculada Concepción. Boletín de calificaciones en línea para familias.",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
