"use client"

import { Label } from "@/components/Label"
import { Input } from "@/components/Input"
import { Checkbox } from "@/components/Checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { Controller, useFormContext } from "react-hook-form"

export type PasswordPreset = "none" | "basic" | "standard" | "strict" | "custom"

export const PASSWORD_PRESETS: Record<
  PasswordPreset,
  {
    label: string
    minLength: number
    requireSpecial: boolean
    requireNumber: boolean
    requireUppercase: boolean
    requireLowercase: boolean
  }
> = {
  none: {
    label: "None",
    minLength: 1,
    requireSpecial: false,
    requireNumber: false,
    requireUppercase: false,
    requireLowercase: false,
  },
  basic: {
    label: "Basic",
    minLength: 8,
    requireSpecial: false,
    requireNumber: false,
    requireUppercase: false,
    requireLowercase: false,
  },
  standard: {
    label: "Standard",
    minLength: 8,
    requireSpecial: true,
    requireNumber: true,
    requireUppercase: false,
    requireLowercase: false,
  },
  strict: {
    label: "Strict",
    minLength: 12,
    requireSpecial: true,
    requireNumber: true,
    requireUppercase: true,
    requireLowercase: true,
  },
  custom: {
    label: "Custom",
    minLength: 8,
    requireSpecial: false,
    requireNumber: false,
    requireUppercase: false,
    requireLowercase: false,
  },
}

export function determinePresetFromSettings(settings: {
  passwordMinLength: number
  requireSpecial: boolean
  requireNumber: boolean
  requireUppercase: boolean
  requireLowercase: boolean
}): PasswordPreset {
  const presets = ["none", "basic", "standard", "strict"] as const
  for (const preset of presets) {
    const config = PASSWORD_PRESETS[preset]
    if (
      config.minLength === settings.passwordMinLength &&
      config.requireSpecial === settings.requireSpecial &&
      config.requireNumber === settings.requireNumber &&
      config.requireUppercase === settings.requireUppercase &&
      config.requireLowercase === settings.requireLowercase
    ) {
      return preset
    }
  }
  return "custom"
}

interface PasswordPresetSelectProps {
  disabled?: boolean
}

export function PasswordPresetSelect({ disabled }: PasswordPresetSelectProps) {
  const { control, watch, setValue } = useFormContext<{
    passwordPreset: PasswordPreset
    passwordMinLength: number
    requireSpecial: boolean
    requireNumber: boolean
    requireUppercase: boolean
    requireLowercase: boolean
  }>()

  const preset = watch("passwordPreset")
  const isCustom = preset === "custom"

  const handlePresetChange = (newPreset: PasswordPreset) => {
    setValue("passwordPreset", newPreset, { shouldDirty: true })
    if (newPreset !== "custom") {
      const config = PASSWORD_PRESETS[newPreset]
      setValue("passwordMinLength", config.minLength, { shouldDirty: true })
      setValue("requireSpecial", config.requireSpecial, { shouldDirty: true })
      setValue("requireNumber", config.requireNumber, { shouldDirty: true })
      setValue("requireUppercase", config.requireUppercase, { shouldDirty: true })
      setValue("requireLowercase", config.requireLowercase, { shouldDirty: true })
    }
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Label htmlFor="passwordPreset" className="font-medium">
          Password policy
        </Label>
        <Controller
          name="passwordPreset"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(v) => handlePresetChange(v as PasswordPreset)}
              disabled={disabled}
            >
              <SelectTrigger id="passwordPreset" className="mt-2">
                <SelectValue placeholder="Select policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="basic">Basic (8 chars)</SelectItem>
                <SelectItem value="standard">Standard (8 chars + special + numbers)</SelectItem>
                <SelectItem value="strict">Strict (12 chars + all requirements)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Password requirements for user registration.
        </p>
      </div>

      {isCustom && (
        <div className="space-y-4 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <div className="max-w-xs">
            <Label htmlFor="passwordMinLength" className="font-medium">
              Minimum length
            </Label>
            <Controller
              name="passwordMinLength"
              control={control}
              render={({ field }) => (
                <Input
                  id="passwordMinLength"
                  type="number"
                  min={1}
                  max={128}
                  disabled={disabled}
                  className="mt-2"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 8)}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Character requirements</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Controller
                  name="requireSpecial"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      disabled={disabled}
                    />
                  )}
                />
                Require special characters
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Controller
                  name="requireNumber"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      disabled={disabled}
                    />
                  )}
                />
                Require numbers
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Controller
                  name="requireUppercase"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      disabled={disabled}
                    />
                  )}
                />
                Require uppercase letters
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Controller
                  name="requireLowercase"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      disabled={disabled}
                    />
                  )}
                />
                Require lowercase letters
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
