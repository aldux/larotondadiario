import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "La Rotonda | Diario Digital de San Rafael",
  description: "Portal local de noticias, periodismo ciudadano y clasificados de compra/venta en San Rafael, Mendoza.",
  keywords: ["San Rafael", "Mendoza", "noticias", "diario", "clasificados", "comunidad", "periodismo ciudadano"],
  openGraph: {
    title: "La Rotonda | Diario Digital de San Rafael",
    description: "Portal local de noticias, periodismo ciudadano y clasificados de compra/venta en San Rafael, Mendoza.",
    siteName: "La Rotonda",
    locale: "es_AR",
    type: "website",
  },
  verification: {
    google: "google37f2ecc8fbd1c1aa.html",
  }
};

import Navbar from "@/components/Navbar";

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}
