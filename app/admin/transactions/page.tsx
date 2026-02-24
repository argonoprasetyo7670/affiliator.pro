"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
    getAllTransactions,
    updateTransactionStatus,
    type AdminTransaction,
} from "@/app/actions/admin"
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

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<AdminTransaction[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState("")
    const [loading, setLoading] = useState(true)
    const limit = 20

    // Update status dialog
    const [updateTransaction, setUpdateTransaction] = useState<AdminTransaction | null>(null)
    const [newStatus, setNewStatus] = useState("")

    async function fetchTransactions() {
        setLoading(true)
        const result = await getAllTransactions(page, limit, statusFilter)
        if (result.success && result.transactions) {
            setTransactions(result.transactions)
            setTotal(result.total || 0)
        } else {
            toast.error(result.error || "Failed to fetch transactions")
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchTransactions()
    }, [page, statusFilter])

    const totalPages = Math.ceil(total / limit)

    async function handleUpdateStatus() {
        if (!updateTransaction || !newStatus) return

        const result = await updateTransactionStatus(updateTransaction.id, newStatus)

        if (result.success) {
            toast.success("Transaction status updated")
            setUpdateTransaction(null)
            fetchTransactions()
        } else {
            toast.error(result.error || "Failed to update status")
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Transaction Management</h1>
                <p className="text-muted-foreground">
                    Kelola semua transaksi pembayaran
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Transactions</CardTitle>
                            <CardDescription>
                                Total {total} transaksi
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="success">Success</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={fetchTransactions}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading...
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No transactions found
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Payment Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell className="font-mono text-xs">
                                                {transaction.orderId.slice(0, 16)}...
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {transaction.user.name || "-"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {transaction.user.email}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{transaction.plan}</Badge>
                                            </TableCell>
                                            <TableCell>{formatPrice(transaction.amount)}</TableCell>
                                            <TableCell>{transaction.paymentType || "-"}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={getStatusColor(transaction.status)}
                                                >
                                                    {transaction.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatDate(transaction.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setUpdateTransaction(transaction)
                                                        setNewStatus(transaction.status)
                                                    }}
                                                >
                                                    Update Status
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm">
                                            Page {page} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setPage(page + 1)}
                                            disabled={page === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Update Status Dialog */}
            <Dialog open={!!updateTransaction} onOpenChange={() => setUpdateTransaction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Transaction Status</DialogTitle>
                        <DialogDescription>
                            Order: {updateTransaction?.orderId}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="success">Success</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUpdateTransaction(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateStatus}>Update Status</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
