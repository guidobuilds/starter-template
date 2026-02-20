import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SettingsSection } from "@/components/admin/settings/SettingsSection"

describe("SettingsSection", () => {
  it("renders title, description, and children", () => {
    render(
      <SettingsSection
        id="general"
        title="General"
        description="General settings"
      >
        <div>Child content</div>
      </SettingsSection>,
    )

    expect(screen.getByRole("heading", { name: "General" })).toBeInTheDocument()
    expect(screen.getByText("General settings")).toBeInTheDocument()
    expect(screen.getByText("Child content")).toBeInTheDocument()
  })

  it("renders loading skeletons when loading", () => {
    render(
      <SettingsSection
        id="general"
        title="General"
        description="General settings"
        loading
      >
        <div>Child content</div>
      </SettingsSection>,
    )

    expect(screen.queryByText("Child content")).not.toBeInTheDocument()
  })
})
