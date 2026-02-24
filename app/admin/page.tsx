"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CreditCard, Coins, Clock, TrendingUp, DollarSign } from "lucide-react"
import { getDashboardStats, getRecentTransactions, type DashboardStats, type AdminTransaction } from "@/app/actions/admin"
import { formatPrice } from "@/lib/credit-packages"

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date))
}

function getStatusColor(status: string) {
    switch (status) {
        case "success":
            return "bg-green-500/10 text-green-500 border-green-500/20"
        case "pending":
            return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
        case "failed":
            return "bg-red-500/10 text-red-500 border-red-500/20"
        case "expired":
            return "bg-gray-500/10 text-gray-500 border-gray-500/20"
        default:
            return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentTransactions, setRecentTransactions] = useState<AdminTransaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            const [statsResult, transactionsResult] = await Promise.all([
                getDashboardStats(),
                getRecentTransactions(5),
            ])

            if (statsResult.success && statsResult.stats) {
                setStats(statsResult.stats)
            }
            if (transactionsResult.success && transactionsResult.transactions) {
                setRecentTransactions(transactionsResult.transactions)
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview statistik dan manajemen platform
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.activeUsersThisMonth || 0} aktif bulan ini
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatPrice(stats?.totalRevenue || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatPrice(stats?.monthlyRevenue || 0)} bulan ini
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credits Distributed</CardTitle>
                        <Coins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.totalCreditsDistributed?.toLocaleString("id-ID") || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total kredit yang didistribusikan
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.pendingTransactions || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Menunggu pembayaran
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaksi Terbaru</CardTitle>
                    <CardDescription>
                        5 transaksi terakhir yang masuk
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {recentTransactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Belum ada transaksi
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {recentTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            {transaction.user.name || transaction.user.email}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {transaction.plan} • {formatDate(transaction.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge
                                            variant="outline"
                                            className={getStatusColor(transaction.status)}
                                        >
                                            {transaction.status}
                                        </Badge>
                                        <span className="text-sm font-medium">
                                            {formatPrice(transaction.amount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
