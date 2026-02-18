import { AuthSettingsLayoutClient } from "./AuthSettingsLayoutClient"

export default function AuthSettingsLayout({ children }: { children: React.ReactNode }) {
  return <AuthSettingsLayoutClient>{children}</AuthSettingsLayoutClient>
}
