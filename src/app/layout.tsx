import type { Metadata, Viewport } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Montserrat({
  variable: "--font-body",
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
  themeColor: "#001d39",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
