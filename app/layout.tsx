import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "くうこうかんせいかん",
  description: "空港の飛行機を着陸させよう！4歳から遊べる空港ゲーム",
  openGraph: {
    title: "くうこうかんせいかん",
    description: "空港の飛行機を着陸させよう！",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" style={{ height: "100%" }}>
      <body style={{ height: "100%", overflow: "hidden" }}>
        {/* Landscape warning overlay */}
        <div
          className="landscape-warn"
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            background: "#1F2430",
            zIndex: 9999,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#F4EADA" strokeWidth={1.5}>
            <path d="M4 8 L4 16 Q4 20 8 20 L16 20 Q20 20 20 16 L20 8 Q20 4 16 4 L8 4 Q4 4 4 8Z" />
            <path d="M9 12 L15 12 M12 9 L12 15" strokeLinecap="round" />
          </svg>
          <p style={{ color: "#F4EADA", fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 800, fontSize: 18, margin: 0 }}>
            Rotate to portrait!
          </p>
        </div>
        <div className="portrait-only" style={{ height: "100%" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
