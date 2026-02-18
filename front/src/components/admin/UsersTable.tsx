"use client"

import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { EntityActionsMenu } from "@/components/EntityActionsMenu"
import { Input } from "@/components/Input"
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/Modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
} from "@/components/Table"
import {
  createUser,
  deleteUser,
  listUsers,
  type User,
  type UserStatus,
  updateUser,
} from "@/lib/api/users"
import { RiAddLine, RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react"
import { useCallback, useEffect, useMemo, useState } from "react"

type Props = {
  initialUsers: User[]
  initialTotal: number
  initialPage: number
  initialPageSize: number
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function UsersTable({
  initialUsers,
  initialTotal,
  initialPage,
  initialPageSize,
}: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formStatus, setFormStatus] = useState<UserStatus>("ENABLED")
  const [formAdmin, setFormAdmin] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const totalPages = Math.ceil(total / pageSize)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listUsers({ page, pageSize, search: search || undefined })
      setUsers(data.items)
      setTotal(data.total)
    } catch {
      setError("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setPage(1)
  }

  const openCreateModal = () => {
    setFormName("")
    setFormEmail("")
    setFormStatus("ENABLED")
    setFormAdmin(false)
    setFormError(null)
    setCreateModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormStatus(user.status)
    setFormAdmin(user.admin)
    setFormError(null)
    setEditModalOpen(true)
  }

  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setDeleteModalOpen(true)
  }

  const handleCreate = async () => {
    if (!formName || !formEmail) {
      setFormError("Name and email are required")
      return
    }
    setFormLoading(true)
    setFormError(null)
    try {
      await createUser({
        name: formName,
        email: formEmail,
        status: formStatus,
        admin: formAdmin,
      })
      setCreateModalOpen(false)
      await fetchUsers()
    } catch {
      setFormError("Failed to create user")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedUser || !formName || !formEmail) {
      setFormError("Name and email are required")
      return
    }
    setFormLoading(true)
    setFormError(null)
    try {
      await updateUser(selectedUser.id, {
        name: formName,
        email: formEmail,
        status: formStatus,
        admin: formAdmin,
      })
      setEditModalOpen(false)
      await fetchUsers()
    } catch {
      setFormError("Failed to update user")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    setFormLoading(true)
    try {
      await deleteUser(selectedUser.id)
      setDeleteModalOpen(false)
      await fetchUsers()
    } catch {
      setFormError("Failed to delete user")
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleStatus = async (user: User) => {
    const newStatus: UserStatus = user.status === "ENABLED" ? "DISABLED" : "ENABLED"
    try {
      await updateUser(user.id, { status: newStatus })
      await fetchUsers()
    } catch {
      setError("Failed to update user status")
    }
  }

  const handleToggleAdmin = async (user: User) => {
    try {
      await updateUser(user.id, { admin: !user.admin })
      await fetchUsers()
    } catch {
      setError("Failed to update user admin status")
    }
  }

  const getActions = (user: User) => [
    { label: "Edit", onClick: () => openEditModal(user) },
    {
      label: user.status === "ENABLED" ? "Disable" : "Enable",
      onClick: () => handleToggleStatus(user),
    },
    {
      label: user.admin ? "Remove admin" : "Make admin",
      onClick: () => handleToggleAdmin(user),
    },
    {
      label: "Delete",
      onClick: () => openDeleteModal(user),
      variant: "destructive" as const,
    },
  ]

  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  return (
    <section className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Users</h1>
        <Button onClick={openCreateModal}>
          <RiAddLine className="size-4" aria-hidden="true" />
          Add user
        </Button>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          type="search"
          placeholder="Search by name or email..."
          className="max-w-sm flex-1"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {search && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchInput("")
              setSearch("")
              setPage(1)
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <TableRoot>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Admin</TableHeaderCell>
              <TableHeaderCell>Created at</TableHeaderCell>
              <TableHeaderCell>Updated at</TableHeaderCell>
              <TableHeaderCell className="w-12">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "ENABLED" ? "success" : "neutral"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.admin ? "Yes" : "No"}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{new Date(user.updatedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <EntityActionsMenu
                      actions={getActions(user)}
                      aria-label={`Actions for ${user.name}`}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableRoot>

      {total > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>
              Page {page} of {totalPages} ({total} total)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => p - 1)}
              disabled={!canGoPrev}
            >
              <RiArrowLeftLine className="size-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => p + 1)}
              disabled={!canGoNext}
            >
              Next
              <RiArrowRightLine className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <Modal open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Create user</ModalTitle>
            <ModalDescription>Add a new user to the system.</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-4">
            {formError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <Select
                value={formStatus}
                onValueChange={(v) => setFormStatus(v as UserStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENABLED">Enabled</SelectItem>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="create-admin"
                checked={formAdmin}
                onChange={(e) => setFormAdmin(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="create-admin"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Admin user
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={formLoading}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={editModalOpen} onOpenChange={setEditModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Edit user</ModalTitle>
            <ModalDescription>Update user information.</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-4">
            {formError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <Select
                value={formStatus}
                onValueChange={(v) => setFormStatus(v as UserStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENABLED">Enabled</SelectItem>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-admin"
                checked={formAdmin}
                onChange={(e) => setFormAdmin(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="edit-admin"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Admin user
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} isLoading={formLoading}>
              Save changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete user</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be
              undone.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={formLoading}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  )
}
