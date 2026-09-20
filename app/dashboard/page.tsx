import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const scans = await prisma.resumeScan.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  type Scan = {
    id: string;
    jobTitle: string | null;
    resumeFilename: string;
    createdAt: Date;
    score: number;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your scan history</h1>
        <Link
          href="/scan"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New scan
        </Link>
      </div>

      {scans.length === 0 ? (
        <p className="text-slate-600">
          No scans yet. Run your first one from the Scan page.
        </p>
      ) : (
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {scans.map((scan: Scan) => (
            <div key={scan.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">
                  {scan.jobTitle || "Untitled role"}
                </p>
                <p className="text-xs text-slate-500">
                  {scan.resumeFilename} ·{" "}
                  {new Date(scan.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`text-lg font-bold ${
                  scan.score >= 75
                    ? "text-emerald-600"
                    : scan.score >= 50
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {scan.score}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
