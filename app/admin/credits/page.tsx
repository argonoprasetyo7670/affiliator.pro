"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
    getCreditHistoryAdmin,
    adjustUserCredits,
    getAllUsers,
    type AdminUser,
} from "@/app/actions/admin"

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date))
}

function getTypeColor(type: string) {
    switch (type) {
        case "purchase":
            return "bg-green-500/10 text-green-500 border-green-500/20"
        case "usage":
            return "bg-blue-500/10 text-blue-500 border-blue-500/20"
        case "refund":
            return "bg-orange-500/10 text-orange-500 border-orange-500/20"
        case "bonus":
            return "bg-purple-500/10 text-purple-500 border-purple-500/20"
        case "admin":
            return "bg-red-500/10 text-red-500 border-red-500/20"
        default:
            return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
}

interface CreditHistoryItem {
    id: string
    amount: number
    type: string
    description: string
    balanceAfter: number
    createdAt: Date
    user: {
        id: string
        name: string | null
        email: string
    }
}

export default function AdminCreditsPage() {
    const [history, setHistory] = useState<CreditHistoryItem[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const limit = 20

    // Bulk add credits dialog
    const [showBulkDialog, setShowBulkDialog] = useState(false)
    const [bulkEmail, setBulkEmail] = useState("")
    const [bulkAmount, setBulkAmount] = useState("")
    const [bulkDescription, setBulkDescription] = useState("")
    const [submitting, setSubmitting] = useState(false)

    async function fetchHistory() {
        setLoading(true)
        const result = await getCreditHistoryAdmin(page, limit)
        if (result.success && result.history) {
            setHistory(result.history)
            setTotal(result.total || 0)
        } else {
            toast.error(result.error || "Failed to fetch credit history")
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchHistory()
    }, [page])

    const totalPages = Math.ceil(total / limit)

    async function handleBulkAddCredits() {
        if (!bulkEmail.trim() || !bulkAmount || !bulkDescription.trim()) {
            toast.error("Please fill all fields")
            return
        }

        setSubmitting(true)

        // First find user by email
        const usersResult = await getAllUsers(1, 1, bulkEmail.trim())
        if (!usersResult.success || !usersResult.users || usersResult.users.length === 0) {
            toast.error("User not found with that email")
            setSubmitting(false)
            return
        }

        const user = usersResult.users[0]
        if (user.email !== bulkEmail.trim()) {
            toast.error("User email does not match exactly")
            setSubmitting(false)
            return
        }

        const amount = parseFloat(bulkAmount)
        if (isNaN(amount)) {
            toast.error("Invalid amount")
            setSubmitting(false)
            return
        }

        const result = await adjustUserCredits(user.id, amount, bulkDescription)

        if (result.success) {
            toast.success(`Credits adjusted for ${user.email}. New balance: ${result.newBalance}`)
            setShowBulkDialog(false)
            setBulkEmail("")
            setBulkAmount("")
            setBulkDescription("")
            fetchHistory()
        } else {
            toast.error(result.error || "Failed to adjust credits")
        }
        setSubmitting(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Credit Management</h1>
                    <p className="text-muted-foreground">
                        Lihat dan kelola kredit semua user
                    </p>
                </div>
                <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Credits
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Credits to User</DialogTitle>
                            <DialogDescription>
                                Add or deduct credits from a user account
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>User Email</Label>
                                <Input
                                    placeholder="user@example.com"
                                    value={bulkEmail}
                                    onChange={(e) => setBulkEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    placeholder="100 or -50"
                                    value={bulkAmount}
                                    onChange={(e) => setBulkAmount(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use positive for adding, negative for deducting
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    placeholder="Reason for adjustment..."
                                    value={bulkDescription}
                                    onChange={(e) => setBulkDescription(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleBulkAddCredits} disabled={submitting}>
                                {submitting ? "Processing..." : "Add Credits"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Credit History</CardTitle>
                            <CardDescription>
                                Total {total} transaksi kredit
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="icon" onClick={fetchHistory}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading...
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No credit history found
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Balance After</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {item.user.name || "-"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.user.email}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={getTypeColor(item.type)}
                                                >
                                                    {item.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={item.amount >= 0 ? "text-green-500" : "text-red-500"}>
                                                    {item.amount >= 0 ? "+" : ""}{item.amount.toLocaleString("id-ID")}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {item.balanceAfter.toLocaleString("id-ID")}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-sm">
                                                {item.description}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatDate(item.createdAt)}
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
        </div>
    )
}
