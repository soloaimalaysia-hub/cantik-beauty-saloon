import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cantik Beauty Saloon | Premium Beauty Services",
  description:
    "Cantik Beauty Saloon — Your premier destination for hair, nails, spa & wellness in Malaysia. Book your appointment via WhatsApp today!",
  keywords: "beauty saloon, hair salon, nail art, spa, massage, Malaysia",
  openGraph: {
    title: "Cantik Beauty Saloon",
    description: "Premium beauty services — hair, nails, spa & wellness",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
