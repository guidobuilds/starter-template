"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/Button"
import { Label } from "@/components/Label"
import { Switch } from "@/components/Switch"
import { useToast } from "@/components/ToastContext"
import {
  SettingsSection,
} from "@/components/admin/settings/SettingsSection"
import {
  useRegisterUnsavedSection,
} from "@/components/admin/settings/UnsavedChangesContext"
import {
  type ApiErrorShape,
  getSettings,
  updateWorkspaceSettings,
} from "@/lib/api/settings"

const workspaceSchema = z.object({
  workspacesEnabled: z.boolean(),
})

type WorkspaceFormValues = z.infer<typeof workspaceSchema>

export function WorkspaceSettingsForm() {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      workspacesEnabled: true,
    },
  })

  useRegisterUnsavedSection("workspace-settings", form.formState.isDirty)

  React.useEffect(() => {
    getSettings()
      .then((settings) => {
        form.reset({
          workspacesEnabled: settings.workspacesEnabled ?? true,
        })
      })
      .catch((error: unknown) => {
        toast({
          variant: "destructive",
          title: "Failed to load workspace settings",
          description:
            (error as ApiErrorShape | undefined)?.message ??
            "Try refreshing the page.",
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [form, toast])

  const onSubmit = async (values: WorkspaceFormValues) => {
    setSaving(true)
    try {
      await updateWorkspaceSettings({
        workspacesEnabled: values.workspacesEnabled,
      })
      form.reset(values)
      toast({
        variant: "success",
        title: "Workspace settings saved",
      })
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Failed to save workspace settings",
        description:
          (error as ApiErrorShape | undefined)?.message ??
          "Check your values and try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <SettingsSection
        id="workspace-settings"
        title="Workspace settings"
        description="Control workspace capabilities for this instance."
        loading={loading}
      >
        <div className="space-y-4">
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="workspacesEnabled" className="font-medium">
                  Enable Workspaces feature
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Users can create and manage workspaces and invite collaborators.
                </p>
              </div>
              <Controller
                name="workspacesEnabled"
                control={form.control}
                render={({ field }) => (
                  <Switch
                    id="workspacesEnabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={saving}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      {!loading && (
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            type="submit"
            isLoading={saving}
            loadingText="Saving..."
            disabled={!form.formState.isDirty || saving}
          >
            Save settings
          </Button>
        </div>
      )}
    </form>
  )
}
