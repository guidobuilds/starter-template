"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import {
  SettingsField,
  SettingsSection,
} from "@/components/admin/settings/SettingsSection"
import {
  useRegisterUnsavedSection,
} from "@/components/admin/settings/UnsavedChangesContext"
import { useToast } from "@/components/ToastContext"
import {
  type ApiErrorShape,
  getSettings,
  updateGeneralSettings,
} from "@/lib/api/settings"

const generalSettingsSchema = z.object({
  instanceName: z
    .string()
    .trim()
    .max(100, "Instance name must be at most 100 characters")
    .optional()
    .or(z.literal("")),
})

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>

function getFieldErrors(error: unknown) {
  const details = (error as ApiErrorShape | undefined)?.details as
    | { fieldErrors?: Record<string, string[] | undefined> }
    | undefined
  return details?.fieldErrors ?? {}
}

export function GeneralSettingsForm() {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      instanceName: "",
    },
  })

  useRegisterUnsavedSection("general-instance", form.formState.isDirty)

  React.useEffect(() => {
    getSettings()
      .then((settings) => {
        form.reset({
          instanceName: settings.instanceName ?? "",
        })
      })
      .catch((error: unknown) => {
        toast({
          variant: "destructive",
          title: "Failed to load settings",
          description:
            (error as ApiErrorShape | undefined)?.message ??
            "Try refreshing the page.",
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [form, toast])

  const onSubmit = async (values: GeneralSettingsFormValues) => {
    setSaving(true)
    try {
      await updateGeneralSettings({
        instanceName: values.instanceName?.trim() || undefined,
      })
      form.reset(values)
      toast({
        variant: "success",
        title: "General settings saved",
      })
    } catch (error: unknown) {
      const fieldErrors = getFieldErrors(error)
      const instanceNameError = fieldErrors.instanceName?.[0]
      if (instanceNameError) {
        form.setError("instanceName", { message: instanceNameError })
      }
      toast({
        variant: "destructive",
        title: "Failed to save settings",
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
        id="instance-settings"
        title="Instance settings"
        description="Configure the application name displayed to users."
        loading={loading}
      >
        <div className="space-y-4">
          <div className="max-w-md">
            <SettingsField
              htmlFor="instanceName"
              label="Instance name"
              description="This name appears in the sidebar header and page title."
            >
              <Input
                id="instanceName"
                placeholder="My Application"
                className="mt-1"
                hasError={!!form.formState.errors.instanceName}
                {...form.register("instanceName")}
              />
            </SettingsField>
            {form.formState.errors.instanceName?.message && (
              <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
                {form.formState.errors.instanceName.message}
              </p>
            )}
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
