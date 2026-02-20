"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { FormProvider, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"
import { Switch } from "@/components/Switch"
import { useToast } from "@/components/ToastContext"
import { PasswordPresetSelect, determinePresetFromSettings } from "@/components/admin/settings/PasswordPresetSelect"
import {
  SettingsSection,
  SettingsSectionDivider,
} from "@/components/admin/settings/SettingsSection"
import {
  useRegisterUnsavedSection,
} from "@/components/admin/settings/UnsavedChangesContext"
import { cx } from "@/lib/utils"
import {
  type ApiErrorShape,
  getSettings,
  updateBasicAuthSettings,
  updateGoogleAuthSettings,
} from "@/lib/api/settings"

const basicSchema = z.object({
  basicAuthEnabled: z.boolean(),
  passwordPreset: z.enum(["none", "basic", "standard", "strict", "custom"]),
  passwordMinLength: z.number().min(1).max(128),
  requireSpecial: z.boolean(),
  requireNumber: z.boolean(),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
})

const googleSchema = z.object({
  googleAuthEnabled: z.boolean(),
  googleClientId: z.string().max(500),
  googleClientSecret: z.string().max(500),
})

type BasicFormValues = z.infer<typeof basicSchema>
type GoogleFormValues = z.infer<typeof googleSchema>

function getFieldErrors(error: unknown) {
  const details = (error as ApiErrorShape | undefined)?.details as
    | { fieldErrors?: Record<string, string[] | undefined> }
    | undefined
  return details?.fieldErrors ?? {}
}

export function AuthenticationSettingsForm() {
  const [loading, setLoading] = React.useState(true)
  const [savingBasic, setSavingBasic] = React.useState(false)
  const [savingGoogle, setSavingGoogle] = React.useState(false)
  const [googleConfigured, setGoogleConfigured] = React.useState(false)
  const [googleEditMode, setGoogleEditMode] = React.useState(false)
  const { toast } = useToast()

  const basicForm = useForm<BasicFormValues>({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      basicAuthEnabled: true,
      passwordPreset: "standard",
      passwordMinLength: 8,
      requireSpecial: true,
      requireNumber: true,
      requireUppercase: false,
      requireLowercase: false,
    },
  })

  const googleForm = useForm<GoogleFormValues>({
    resolver: zodResolver(googleSchema),
    defaultValues: {
      googleAuthEnabled: false,
      googleClientId: "",
      googleClientSecret: "",
    },
  })

  useRegisterUnsavedSection("auth-basic", basicForm.formState.isDirty)
  useRegisterUnsavedSection("auth-google", googleForm.formState.isDirty)

  React.useEffect(() => {
    getSettings()
      .then((settings) => {
        basicForm.reset({
          basicAuthEnabled: settings.basicAuthEnabled,
          passwordPreset: determinePresetFromSettings({
            passwordMinLength: settings.passwordMinLength,
            requireSpecial: settings.requireSpecial,
            requireNumber: settings.requireNumber,
            requireUppercase: settings.requireUppercase,
            requireLowercase: settings.requireLowercase,
          }),
          passwordMinLength: settings.passwordMinLength,
          requireSpecial: settings.requireSpecial,
          requireNumber: settings.requireNumber,
          requireUppercase: settings.requireUppercase,
          requireLowercase: settings.requireLowercase,
        })

        googleForm.reset({
          googleAuthEnabled: settings.googleAuthEnabled,
          googleClientId: "",
          googleClientSecret: "",
        })

        setGoogleConfigured(settings.googleConfigured)
      })
      .catch((error: unknown) => {
        toast({
          variant: "destructive",
          title: "Failed to load authentication settings",
          description:
            (error as ApiErrorShape | undefined)?.message ??
            "Try refreshing the page.",
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [basicForm, googleForm, toast])

  const onSaveBasic = async (values: BasicFormValues) => {
    setSavingBasic(true)
    try {
      await updateBasicAuthSettings({
        basicAuthEnabled: values.basicAuthEnabled,
        passwordMinLength: values.passwordMinLength,
        requireSpecial: values.requireSpecial,
        requireNumber: values.requireNumber,
        requireUppercase: values.requireUppercase,
        requireLowercase: values.requireLowercase,
      })
      basicForm.reset(values)
      toast({
        variant: "success",
        title: "Basic authentication settings saved",
      })
    } catch (error: unknown) {
      const fieldErrors = getFieldErrors(error)
      const minLengthError = fieldErrors.passwordMinLength?.[0]
      if (minLengthError) {
        basicForm.setError("passwordMinLength", { message: minLengthError })
      }
      toast({
        variant: "destructive",
        title: "Failed to save basic authentication settings",
        description:
          (error as ApiErrorShape | undefined)?.message ??
          "Check your values and try again.",
      })
    } finally {
      setSavingBasic(false)
    }
  }

  const onSaveGoogle = async (values: GoogleFormValues) => {
    setSavingGoogle(true)
    try {
      const payload: {
        googleAuthEnabled: boolean
        googleClientId?: string | null
        googleClientSecret?: string | null
      } = {
        googleAuthEnabled: values.googleAuthEnabled,
      }

      if (googleEditMode || !googleConfigured) {
        payload.googleClientId = values.googleClientId.trim() || null
        payload.googleClientSecret = values.googleClientSecret.trim() || null
      }

      const result = await updateGoogleAuthSettings(payload)

      setGoogleConfigured(result.googleConfigured)
      setGoogleEditMode(false)
      googleForm.reset({
        googleAuthEnabled: result.googleAuthEnabled,
        googleClientId: "",
        googleClientSecret: "",
      })

      toast({
        variant: "success",
        title: "Google authentication settings saved",
      })
    } catch (error: unknown) {
      const fieldErrors = getFieldErrors(error)
      const clientIdError = fieldErrors.googleClientId?.[0]
      const clientSecretError = fieldErrors.googleClientSecret?.[0]
      if (clientIdError) {
        googleForm.setError("googleClientId", { message: clientIdError })
      }
      if (clientSecretError) {
        googleForm.setError("googleClientSecret", { message: clientSecretError })
      }
      toast({
        variant: "destructive",
        title: "Failed to save Google authentication settings",
        description:
          (error as ApiErrorShape | undefined)?.message ??
          "Check your values and try again.",
      })
    } finally {
      setSavingGoogle(false)
    }
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const allowUrl = baseUrl
  const redirectUrl = `${baseUrl}/api/auth/callback/google`

  const basicEnabled = basicForm.watch("basicAuthEnabled")
  const googleEnabled = googleForm.watch("googleAuthEnabled")
  const allProvidersDisabled = !basicEnabled && !googleEnabled

  return (
    <div className="space-y-10">
      <FormProvider {...basicForm}>
        <form onSubmit={basicForm.handleSubmit(onSaveBasic)}>
          <SettingsSection
            id="basic-authentication"
            title="Basic authentication"
            description="Configure email/password login and password requirements."
            loading={loading}
          >
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="basicAuthEnabled" className="font-medium">
                      Enable Basic authentication (email/password)
                    </Label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      When disabled, users cannot register or sign in with email and
                      password.
                    </p>
                  </div>
                  <Switch
                    id="basicAuthEnabled"
                    checked={basicEnabled}
                    onCheckedChange={(checked) => {
                      basicForm.setValue("basicAuthEnabled", checked, {
                        shouldDirty: true,
                      })
                    }}
                    disabled={savingBasic || loading}
                  />
                </div>
              </Card>

              <div className={cx("space-y-4", !basicEnabled && "opacity-50")}>
                <PasswordPresetSelect disabled={!basicEnabled || savingBasic || loading} />
                {basicForm.formState.errors.passwordMinLength?.message && (
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    {basicForm.formState.errors.passwordMinLength.message}
                  </p>
                )}
              </div>

              {allProvidersDisabled && (
                <Card className="border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/20">
                  <p className="text-sm font-medium text-rose-900 dark:text-rose-100">
                    Danger zone
                  </p>
                  <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                    Disabling both Basic and Google authentication can lock users out
                    of the application.
                  </p>
                </Card>
              )}
            </div>
          </SettingsSection>

          {!loading && (
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="submit"
                isLoading={savingBasic}
                loadingText="Saving..."
                disabled={!basicForm.formState.isDirty || savingBasic}
              >
                Save basic settings
              </Button>
            </div>
          )}
        </form>
      </FormProvider>

      <SettingsSectionDivider show={!loading} />

      <form onSubmit={googleForm.handleSubmit(onSaveGoogle)}>
        <SettingsSection
          id="google-authentication"
          title="Google OAuth"
          description="Configure Google single sign-on credentials."
          loading={loading}
        >
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="googleAuthEnabled" className="font-medium">
                    Enable Google authentication
                  </Label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Allow users to sign in with their Google accounts.
                  </p>
                </div>
                <Switch
                  id="googleAuthEnabled"
                  checked={googleEnabled}
                  onCheckedChange={(checked) => {
                    googleForm.setValue("googleAuthEnabled", checked, {
                      shouldDirty: true,
                    })
                  }}
                  disabled={savingGoogle || loading}
                />
              </div>
            </Card>

            <div className={cx("space-y-4", !googleEnabled && "opacity-50")}>
              {googleConfigured && !googleEditMode ? (
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Google OAuth is configured
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Credentials are securely stored. Click "Change" to update.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setGoogleEditMode(true)}
                      disabled={!googleEnabled || savingGoogle || loading}
                    >
                      Change
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="space-y-4 p-4">
                  <div className="max-w-md">
                    <Label htmlFor="googleClientId" className="font-medium">
                      Google Client ID
                    </Label>
                    <Input
                      id="googleClientId"
                      type="text"
                      placeholder="your-client-id.apps.googleusercontent.com"
                      className="mt-2"
                      hasError={!!googleForm.formState.errors.googleClientId}
                      disabled={!googleEnabled || savingGoogle || loading}
                      {...googleForm.register("googleClientId")}
                    />
                    {googleForm.formState.errors.googleClientId?.message && (
                      <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
                        {googleForm.formState.errors.googleClientId.message}
                      </p>
                    )}
                  </div>

                  <div className="max-w-md">
                    <Label htmlFor="googleClientSecret" className="font-medium">
                      Google Client Secret
                    </Label>
                    <Input
                      id="googleClientSecret"
                      type="password"
                      placeholder={
                        googleConfigured
                          ? "Leave blank to keep existing"
                          : "Enter your client secret"
                      }
                      className="mt-2"
                      hasError={!!googleForm.formState.errors.googleClientSecret}
                      disabled={!googleEnabled || savingGoogle || loading}
                      {...googleForm.register("googleClientSecret")}
                    />
                    {googleForm.formState.errors.googleClientSecret?.message && (
                      <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
                        {googleForm.formState.errors.googleClientSecret.message}
                      </p>
                    )}
                  </div>

                  {googleEditMode && googleConfigured && (
                    <div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setGoogleEditMode(false)
                          googleForm.reset({
                            ...googleForm.getValues(),
                            googleClientId: "",
                            googleClientSecret: "",
                          })
                        }}
                        disabled={savingGoogle}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              <Card className="border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Google Cloud Console Configuration
                </h5>
                <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                  Configure these URLs in your Google Cloud Console:
                </p>
                <div className="mt-3 space-y-2">
                  <div>
                    <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                      Authorized JavaScript origins:
                    </span>
                    <code className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                      {allowUrl}
                    </code>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                      Authorized redirect URI:
                    </span>
                    <code className="ml-2 break-all rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                      {redirectUrl}
                    </code>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </SettingsSection>

        {!loading && (
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              type="submit"
              isLoading={savingGoogle}
              loadingText="Saving..."
              disabled={!googleForm.formState.isDirty || savingGoogle}
            >
              Save Google settings
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
