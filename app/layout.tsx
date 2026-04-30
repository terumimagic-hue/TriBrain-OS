import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TriBrain OS",
  description:
    "An AI council. ChatGPT + Claude + Gemini answer in parallel, then synthesize one final answer."
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
