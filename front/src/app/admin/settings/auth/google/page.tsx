import { redirect } from "next/navigation"

export default function GoogleAuthSettingsPage() {
  redirect("/admin/settings/auth")
}
