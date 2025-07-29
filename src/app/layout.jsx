import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/provider/Providers";
import "@rainbow-me/rainbowkit/styles.css";
import { Cursors } from "react-together";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Multisynq Multiplayer Game",
  description: "Multisynq Multiplayer Game",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <main className="">{children}</main>
          <Cursors />
        </Providers>
      </body>
    </html>
  );
}
