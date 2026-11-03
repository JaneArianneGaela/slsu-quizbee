import type { Metadata, Viewport } from "next";
import { Anton, Hanken_Grotesk, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "600"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Battle of the Scholar Minds · SLSU-DOST SA STEM Quiz Bee",
  description:
    "SLSU-DOST SA STEM Quiz Bee — Battle of the Scholar Minds, November 13, 2026.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#DDEBFF",
};

// [left %, size px, duration s, delay s] — fixed values so SSR and client match
const DOTS: [number, number, number, number][] = [
  [4, 6, 14, -2], [11, 9, 19, -9], [19, 5, 12, -5], [27, 11, 22, -14],
  [34, 7, 16, -7], [42, 8, 18, -18], [49, 10, 13, -3], [57, 6, 21, -11],
  [63, 12, 15, -16], [71, 5, 23, -1], [78, 9, 17, -12], [84, 7, 12, -8],
  [90, 6, 20, -19], [95, 10, 14, -6], [23, 8, 24, -15], [67, 5, 18, -4],
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${hanken.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div aria-hidden="true">
          <i className="blob blob-1" />
          <i className="blob blob-2" />
          <i className="blob blob-3" />
          {DOTS.map(([left, size, dur, delay], i) => (
            <i
              key={i}
              className="dot"
              style={{
                left: `${left}%`,
                width: size,
                height: size,
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
              }}
            />
          ))}
        </div>
        <div className="relative z-[1] flex min-h-full flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}