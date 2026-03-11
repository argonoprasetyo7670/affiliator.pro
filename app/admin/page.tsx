"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, CreditCard, Coins, Clock, TrendingUp, DollarSign, Trash2, AlertTriangle, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { getDashboardStats, getRecentTransactions, deleteExpiredAssets, getExpiredAssetsCount, type DashboardStats, type AdminTransaction } from "@/app/actions/admin"
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
    const [expiredCount, setExpiredCount] = useState(0)
    const [deletingExpired, setDeletingExpired] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null)

    useEffect(() => {
        async function fetchData() {
            const [statsResult, transactionsResult, expiredResult] = await Promise.all([
                getDashboardStats(),
                getRecentTransactions(5),
                getExpiredAssetsCount(),
            ])

            if (statsResult.success && statsResult.stats) {
                setStats(statsResult.stats)
            }
            if (transactionsResult.success && transactionsResult.transactions) {
                setRecentTransactions(transactionsResult.transactions)
            }
            if (expiredResult.success) {
                setExpiredCount(expiredResult.count ?? 0)
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

            {/* Expired Assets */}
            <Card className={expiredCount > 0 ? "border-orange-300" : ""}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className={`h-5 w-5 ${expiredCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                                Expired Assets
                            </CardTitle>
                            <CardDescription>
                                Asset yang sudah lebih dari 3 hari (URL expired)
                            </CardDescription>
                        </div>
                        <div className="text-2xl font-bold">{expiredCount}</div>
                    </div>
                </CardHeader>
                <CardContent>
                    {expiredCount > 0 ? (
                        <button
                            onClick={() => { setDeleteResult(null); setShowDeleteDialog(true) }}
                            disabled={deletingExpired}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors text-sm font-medium"
                        >
                            <Trash2 className="h-4 w-4" /> Hapus {expiredCount} Asset Expired
                        </button>
                    ) : (
                        <p className="text-sm text-muted-foreground">Tidak ada asset expired</p>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={(open) => { if (!deletingExpired) setShowDeleteDialog(open) }}>
                <DialogContent className="sm:max-w-md">
                    {deleteResult ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {deleteResult.success
                                        ? <><CheckCircle2 className="h-5 w-5 text-green-500" /> Berhasil</>
                                        : <><XCircle className="h-5 w-5 text-red-500" /> Gagal</>
                                    }
                                </DialogTitle>
                                <DialogDescription>{deleteResult.message}</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <button
                                    onClick={() => { setShowDeleteDialog(false); setDeleteResult(null) }}
                                    className="px-4 py-2 rounded-lg bg-black text-white hover:bg-black/80 text-sm font-medium transition-colors"
                                >
                                    Tutup
                                </button>
                            </DialogFooter>
                        </>
                    ) : deletingExpired ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <Loader2 className="h-10 w-10 animate-spin text-red-500" />
                            <div className="text-center">
                                <p className="font-medium">Menghapus asset expired...</p>
                                <p className="text-sm text-muted-foreground mt-1">Menghapus asset,  Mohon tunggu.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-orange-500" /> Konfirmasi Hapus
                                </DialogTitle>
                                <DialogDescription>
                                    Hapus <span className="font-semibold text-foreground">{expiredCount}</span> asset yang sudah expired? Asset akan dihapus dari Cloudinary dan database. Aksi ini tidak bisa dibatalkan.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <button
                                    onClick={() => setShowDeleteDialog(false)}
                                    className="px-4 py-2 rounded-lg border border-black/10 hover:bg-black/5 text-sm font-medium transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={async () => {
                                        setDeletingExpired(true)
                                        const result = await deleteExpiredAssets()
                                        if (result.success) {
                                            setExpiredCount(0)
                                            setDeleteResult({ success: true, message: `Berhasil menghapus ${result.deletedCount} asset expired.` })
                                        } else {
                                            setDeleteResult({ success: false, message: result.error || "Gagal menghapus asset expired." })
                                        }
                                        setDeletingExpired(false)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm font-medium transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" /> Hapus Semua
                                </button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

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
