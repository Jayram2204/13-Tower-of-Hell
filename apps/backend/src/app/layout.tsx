export const metadata = {
  title: "13 Towers of Hell - Backend",
  description: "13 Towers of Hell Game Backend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
