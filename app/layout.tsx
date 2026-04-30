import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookBrain OS",
  description:
    "Fully automated AI book creation and knowledge accumulation. Gemini researches, Claude writes, James commercializes."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
