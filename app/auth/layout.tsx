import { PublicNavbar } from "../components/public/layout/PublicNavbar";
import { PublicFooter } from "../components/public/layout/PublicFooter";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
