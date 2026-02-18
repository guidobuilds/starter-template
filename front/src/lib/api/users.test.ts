import { afterEach, describe, expect, it, vi } from "vitest"
import { createUser, deleteUser, listUsers, updateUser } from "./users"

describe("users api client", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("lists users", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
      }),
    )

    const data = await listUsers({ page: 1, pageSize: 20, search: "joe" })
    expect(data.total).toBe(0)
  })

  it("creates user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "1", name: "Joe", email: "joe@example.com" }),
      }),
    )

    const user = await createUser({ name: "Joe", email: "joe@example.com" })
    expect(user.email).toBe("joe@example.com")
  })

  it("updates user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "1", name: "New" }),
      }),
    )

    const user = await updateUser("1", { name: "New" })
    expect(user.name).toBe("New")
  })

  it("deletes user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    )

    await expect(deleteUser("1")).resolves.toBeUndefined()
  })
})
