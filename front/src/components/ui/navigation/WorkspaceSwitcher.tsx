"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { createWorkspace, getWorkspaces, type Workspace } from "@/lib/api/workspaces"
import { cx, focusRing } from "@/lib/utils"
import { Check, ChevronDown, Plus, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

type WorkspaceSwitcherProps = {
  activeWorkspaceId?: string
}

export function WorkspaceSwitcher({ activeWorkspaceId }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeId, setActiveId] = React.useState<string | undefined>(activeWorkspaceId)
  const [showNewInput, setShowNewInput] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [creating, setCreating] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    getWorkspaces()
      .then(async (data) => {
        setWorkspaces(data.items)
        const defaultWs = data.items.find((w) => w.isDefault) ?? data.items[0]
        if (!activeWorkspaceId && defaultWs) {
          // No cookie set yet — set default workspace
          await switchTo(defaultWs.id)
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function switchTo(id: string) {
    await fetch("/api/workspaces/switch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId: id }),
    })
    setActiveId(id)
    router.refresh()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const ws = await createWorkspace({ name: newName.trim() })
      setNewName("")
      setShowNewInput(false)
      setWorkspaces((prev) => [...prev, ws])
      await switchTo(ws.id)
      setOpen(false)
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  const activeWorkspace =
    workspaces.find((w) => w.id === activeId) ??
    workspaces.find((w) => w.isDefault) ??
    workspaces[0]

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-sm text-gray-400 dark:text-gray-600">Loading...</span>
      </div>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cx(
            "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium",
            "text-gray-900 dark:text-gray-50",
            "hover:bg-gray-200/50 dark:hover:bg-gray-800/50",
            "transition-colors",
            focusRing,
          )}
        >
          <span className="truncate">{activeWorkspace?.name ?? "Select workspace"}</span>
          <ChevronDown className="size-4 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => {
              if (ws.id !== activeId) {
                void switchTo(ws.id)
              }
              setOpen(false)
            }}
          >
            <span className="flex w-full items-center gap-2">
              <span className="flex-1 truncate">{ws.name}</span>
              {ws.id === activeId && (
                <Check className="size-4 shrink-0 text-blue-500" aria-hidden="true" />
              )}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {showNewInput ? (
          <form onSubmit={handleCreate} className="px-2 py-1">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Workspace name"
              className="w-full rounded-sm border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-gray-800 dark:bg-gray-950"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setShowNewInput(false)
                  setNewName("")
                }
              }}
            />
            <div className="mt-1 flex gap-1">
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="rounded-sm bg-blue-500 px-2 py-0.5 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewInput(false)
                  setNewName("")
                }}
                className="rounded-sm px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setShowNewInput(true)
            }}
          >
            <Plus className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
            <span className="ml-2">New workspace</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            setOpen(false)
            router.push("/workspaces/settings")
          }}
        >
          <Settings className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
          <span className="ml-2">Workspace settings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
