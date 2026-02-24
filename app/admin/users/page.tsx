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
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Search, Edit, Trash2, Coins, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import {
    getAllUsers,
    updateUser,
    deleteUser,
    adjustUserCredits,
    type AdminUser,
} from "@/app/actions/admin"

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(date))
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [searchInput, setSearchInput] = useState("")
    const [loading, setLoading] = useState(true)
    const limit = 20

    // Edit user dialog
    const [editUser, setEditUser] = useState<AdminUser | null>(null)
    const [editRole, setEditRole] = useState("")
    const [editDiscount, setEditDiscount] = useState("")

    // Credit adjustment dialog
    const [creditUser, setCreditUser] = useState<AdminUser | null>(null)
    const [creditAmount, setCreditAmount] = useState("")
    const [creditDescription, setCreditDescription] = useState("")

    // Delete confirmation
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    async function fetchUsers() {
        setLoading(true)
        const result = await getAllUsers(page, limit, search)
        if (result.success && result.users) {
            setUsers(result.users)
            setTotal(result.total || 0)
        } else {
            toast.error(result.error || "Failed to fetch users")
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()
    }, [page, search])

    const totalPages = Math.ceil(total / limit)

    function handleSearch() {
        setPage(1)
        setSearch(searchInput)
    }

    async function handleUpdateUser() {
        if (!editUser) return

        const result = await updateUser(editUser.id, {
            role: editRole,
            discountPercent: parseInt(editDiscount) || 0,
        })

        if (result.success) {
            toast.success("User updated successfully")
            setEditUser(null)
            fetchUsers()
        } else {
            toast.error(result.error || "Failed to update user")
        }
    }

    async function handleAdjustCredits() {
        if (!creditUser) return

        const amount = parseFloat(creditAmount)
        if (isNaN(amount)) {
            toast.error("Invalid credit amount")
            return
        }

        if (!creditDescription.trim()) {
            toast.error("Description is required")
            return
        }

        const result = await adjustUserCredits(
            creditUser.id,
            amount,
            creditDescription
        )

        if (result.success) {
            toast.success(`Credits adjusted. New balance: ${result.newBalance}`)
            setCreditUser(null)
            setCreditAmount("")
            setCreditDescription("")
            fetchUsers()
        } else {
            toast.error(result.error || "Failed to adjust credits")
        }
    }

    async function handleDeleteUser() {
        if (!deleteUserId) return

        setDeleting(true)
        const result = await deleteUser(deleteUserId)

        if (result.success) {
            toast.success("User deleted successfully")
            setDeleteUserId(null)
            fetchUsers()
        } else {
            toast.error(result.error || "Failed to delete user")
        }
        setDeleting(false)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">
                    Kelola semua user platform
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Users</CardTitle>
                            <CardDescription>
                                Total {total} users terdaftar
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Search by name or email..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="w-64"
                            />
                            <Button variant="outline" size="icon" onClick={handleSearch}>
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No users found
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Credits</TableHead>
                                        <TableHead>Discount</TableHead>
                                        <TableHead>Transactions</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {user.name || "-"}
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={user.role === "admin" ? "default" : "secondary"}
                                                >
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{user.credits.toLocaleString("id-ID")}</TableCell>
                                            <TableCell>{user.discountPercent}%</TableCell>
                                            <TableCell>{user._count?.transactions || 0}</TableCell>
                                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setCreditUser(user)
                                                            setCreditAmount("")
                                                            setCreditDescription("")
                                                        }}
                                                        title="Adjust Credits"
                                                    >
                                                        <Coins className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setEditUser(user)
                                                            setEditRole(user.role)
                                                            setEditDiscount(user.discountPercent.toString())
                                                        }}
                                                        title="Edit User"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteUserId(user.id)}
                                                        title="Delete User"
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
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

            {/* Edit User Dialog */}
            <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update {editUser?.name || editUser?.email}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={editRole} onValueChange={setEditRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Discount Percent (%)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={editDiscount}
                                onChange={(e) => setEditDiscount(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditUser(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateUser}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Adjust Credits Dialog */}
            <Dialog open={!!creditUser} onOpenChange={() => setCreditUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Credits</DialogTitle>
                        <DialogDescription>
                            {creditUser?.name || creditUser?.email} - Current balance: {creditUser?.credits.toLocaleString("id-ID")} credits
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input
                                type="number"
                                placeholder="Use negative for deduction, positive for addition"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Use positive number to add credits, negative to deduct
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="Reason for adjustment..."
                                value={creditDescription}
                                onChange={(e) => setCreditDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreditUser(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAdjustCredits}>Adjust Credits</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteUserId(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
