import { redirect } from "next/navigation"

export default function BasicAuthSettingsPage() {
  redirect("/admin/settings/auth")
}
