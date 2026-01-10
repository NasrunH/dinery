import BottomNav from "@/components/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-800">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}