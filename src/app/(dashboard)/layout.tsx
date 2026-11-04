import BottomNav from "@/components/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative flex flex-col">
      <main className="flex-1 w-full">{children}</main>
      <BottomNav />
    </div>
  );
}
