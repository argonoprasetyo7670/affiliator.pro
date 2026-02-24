import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardOverview } from "./dashboard-overview"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {session.user.name || session.user.email}
        </p>
      </div>
      <div className="mt-6">
        <DashboardOverview />
      </div>
    </div>
  )
}
