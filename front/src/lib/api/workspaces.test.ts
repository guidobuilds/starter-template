import { afterEach, describe, expect, it, vi } from "vitest"
import {
  acceptInvitation,
  cancelInvitation,
  createWorkspace,
  deleteWorkspace,
  getInvitations,
  getWorkspace,
  getWorkspaces,
  inviteMember,
  removeMember,
  resolveInvitation,
  updateWorkspace,
} from "./workspaces"

describe("workspaces api client", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("fetches workspaces", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
      }),
    )

    const result = await getWorkspaces()
    expect(result.total).toBe(0)
    expect(result.items).toHaveLength(0)
  })

  it("creates workspace", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "ws-1", name: "Test", ownerId: "u-1", isDefault: false }),
      }),
    )

    const ws = await createWorkspace({ name: "Test" })
    expect(ws.id).toBe("ws-1")
    expect(ws.name).toBe("Test")
  })

  it("throws on create workspace failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Workspaces disabled" }),
      }),
    )

    await expect(createWorkspace({ name: "Test" })).rejects.toThrow("Workspaces disabled")
  })

  it("gets workspace detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "ws-1",
          name: "Test",
          ownerId: "u-1",
          isDefault: false,
          members: [],
          invitations: [],
        }),
      }),
    )

    const ws = await getWorkspace("ws-1")
    expect(ws.id).toBe("ws-1")
    expect(ws.members).toHaveLength(0)
  })

  it("throws on get workspace failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    await expect(getWorkspace("ws-1")).rejects.toThrow("Failed to fetch workspace")
  })

  it("updates workspace", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "ws-1", name: "New Name" }),
      }),
    )

    const ws = await updateWorkspace("ws-1", { name: "New Name" })
    expect(ws.name).toBe("New Name")
  })

  it("deletes workspace", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    )

    const result = await deleteWorkspace("ws-1")
    expect(result.success).toBe(true)
  })

  it("throws on delete workspace failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Cannot delete default" }),
      }),
    )

    await expect(deleteWorkspace("ws-1")).rejects.toThrow("Cannot delete default")
  })

  it("removes member", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    )

    const result = await removeMember("ws-1", "member-1")
    expect(result.success).toBe(true)
  })

  it("gets invitations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: "inv-1", email: "test@example.com", status: "PENDING" }],
      }),
    )

    const invitations = await getInvitations("ws-1")
    expect(invitations).toHaveLength(1)
    expect(invitations[0]?.email).toBe("test@example.com")
  })

  it("invites member", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "inv-1", email: "new@example.com", token: "abc", status: "PENDING" }),
      }),
    )

    const inv = await inviteMember("ws-1", { email: "new@example.com" })
    expect(inv.email).toBe("new@example.com")
  })

  it("cancels invitation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    )

    const result = await cancelInvitation("ws-1", "inv-1")
    expect(result.success).toBe(true)
  })

  it("resolves invitation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "inv-1",
          token: "some-token",
          workspace: { id: "ws-1", name: "Test" },
          invitedBy: { id: "u-1", name: "Owner" },
        }),
      }),
    )

    const inv = await resolveInvitation("some-token")
    expect(inv.workspace?.name).toBe("Test")
  })

  it("throws on resolve invitation failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    await expect(resolveInvitation("bad-token")).rejects.toThrow("Failed to resolve invitation")
  })

  it("accepts invitation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ workspaceId: "ws-1" }),
      }),
    )

    const result = await acceptInvitation("some-token")
    expect(result.workspaceId).toBe("ws-1")
  })

  it("throws on accept invitation failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Invitation expired" }),
      }),
    )

    await expect(acceptInvitation("bad-token")).rejects.toThrow("Invitation expired")
  })
})
