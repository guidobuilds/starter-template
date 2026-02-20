"use client"

import * as React from "react"

type DirtyRegistry = Record<string, boolean>

interface UnsavedChangesContextValue {
  hasUnsavedChanges: boolean
  setSectionDirty: (sectionId: string, dirty: boolean) => void
  clearAllUnsavedChanges: () => void
}

const UnsavedChangesContext = React.createContext<UnsavedChangesContextValue | null>(
  null,
)

export function UnsavedChangesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [registry, setRegistry] = React.useState<DirtyRegistry>({})

  const setSectionDirty = React.useCallback((sectionId: string, dirty: boolean) => {
    setRegistry((prev) => {
      if (!dirty && !prev[sectionId]) {
        return prev
      }
      return {
        ...prev,
        [sectionId]: dirty,
      }
    })
  }, [])

  const clearAllUnsavedChanges = React.useCallback(() => {
    setRegistry({})
  }, [])

  const hasUnsavedChanges = React.useMemo(
    () => Object.values(registry).some(Boolean),
    [registry],
  )

  React.useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return
      }
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasUnsavedChanges])

  return (
    <UnsavedChangesContext.Provider
      value={{ hasUnsavedChanges, setSectionDirty, clearAllUnsavedChanges }}
    >
      {children}
    </UnsavedChangesContext.Provider>
  )
}

export function useUnsavedChanges() {
  const context = React.useContext(UnsavedChangesContext)
  if (!context) {
    throw new Error("useUnsavedChanges must be used within UnsavedChangesProvider")
  }
  return context
}

export function useRegisterUnsavedSection(sectionId: string, dirty: boolean) {
  const { setSectionDirty } = useUnsavedChanges()

  React.useEffect(() => {
    setSectionDirty(sectionId, dirty)
  }, [dirty, sectionId, setSectionDirty])

  React.useEffect(
    () => () => {
      setSectionDirty(sectionId, false)
    },
    [sectionId, setSectionDirty],
  )
}
