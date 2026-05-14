import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rs Atelier Studio | Premium Beauty Services",
  description:
    "Rs Atelier Studio — Your premier destination for hair, nails, spa & wellness in Malaysia. Book your appointment via WhatsApp today!",
  keywords: "beauty studio, hair salon, nail art, spa, massage, Malaysia",
  openGraph: {
    title: "Rs Atelier Studio",
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
