import "@/app/globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "QuickDrop Dashboard",
  description: "ติดตามการถ่ายโอนไฟล์และประสิทธิภาพของระบบ",
}

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
