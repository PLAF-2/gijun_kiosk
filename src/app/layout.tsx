import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "영화관 키오스크",
  description: "영화와 좌석을 선택하고 예매를 관리하는 시연용 키오스크",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
