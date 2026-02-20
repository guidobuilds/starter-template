import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Switch } from "@/components/Switch"

function SwitchHarness() {
  const [checked, setChecked] = React.useState(false)

  return (
    <Switch
      aria-label="toggle"
      checked={checked}
      onCheckedChange={setChecked}
    />
  )
}

describe("Switch", () => {
  it("toggles checked state", () => {
    render(<SwitchHarness />)

    const toggle = screen.getByRole("switch", { name: "toggle" })

    expect(toggle).toHaveAttribute("data-state", "unchecked")
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("data-state", "checked")
  })
})
