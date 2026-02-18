import { UsersTable } from "@/components/admin/UsersTable"
import { listUsers } from "@/lib/api/users"

export default async function AdminUsersPage() {
  const data = await listUsers({ page: 1, pageSize: 20 }).catch(() => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  }))

  return (
    <UsersTable
      initialUsers={data.items}
      initialTotal={data.total}
      initialPage={data.page}
      initialPageSize={data.pageSize}
    />
  )
}
