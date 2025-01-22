import { Geist, Geist_Mono } from "next/font/google";
import { Space_Grotesk } from 'next/font/google'
import localFont from 'next/font/local'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

const cabinetGrotesk = localFont({
  src: './fonts/CabinetGrotesk-Variable.woff2',
  variable: '--font-cabinet-grotesk',
})

export const metadata = {
  title: "Simone - Daily Pattern Game",
  description: "A daily pattern memory game inspired by Simon",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${cabinetGrotesk.variable}`}>
      <body className="font-space-grotesk antialiased">
        {children}
      </body>
    </html>
  );
}
