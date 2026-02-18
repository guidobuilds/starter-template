import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Administration</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Manage platform configuration and users.
      </p>
      <Link
        href="/admin/users"
        className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Go to user management
      </Link>
    </div>
  )
}
