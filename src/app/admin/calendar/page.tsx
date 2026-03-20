"use client"

import { useState, useEffect } from "react"
import { Calendar, Save, ExternalLink, CheckCircle } from "lucide-react"
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard"

export default function CalendarSettingsPage() {
  const [calendarUrl, setCalendarUrl] = useState("")
  const [initialCalendarUrl, setInitialCalendarUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings?key=outlook_calendar_url")
        if (res.ok) {
          const data = await res.json()
          const value = data?.value ? String(data.value) : ""
          setCalendarUrl(value)
          setInitialCalendarUrl(value)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "outlook_calendar_url", value: calendarUrl }),
    })

    if (res.ok) {
      setSaved(true)
      setInitialCalendarUrl(calendarUrl)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const hasUnsavedChanges = !loading && calendarUrl.trim() !== initialCalendarUrl.trim()
  useUnsavedChangesGuard({
    enabled: hasUnsavedChanges,
    title: "Kalenderlink er ændret",
    description: "ICS Calendar URL er ændret, men ikke gemt. Hvis du forlader siden nu, går ændringen tabt.",
    confirmText: "Forlad uden at gemme",
    cancelText: "Bliv og gem",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendar Settings</h1>
        <p className="text-muted text-sm mt-1">Connect your Outlook calendar to the info board</p>
      </div>

      <div className="admin-panel p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-violet-400/10 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-foreground font-semibold">Outlook Calendar Integration</h2>
            <p className="text-muted text-sm">Paste your ICS calendar URL to sync events</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">ICS Calendar URL</label>
            <input
              type="url"
              value={calendarUrl}
              onChange={(e) => setCalendarUrl(e.target.value)}
              placeholder="https://outlook.office365.com/owa/calendar/..."
              disabled={loading}
              className="admin-input focus:ring-2 focus:ring-accent/40 focus:border-accent/60"
            />
            <p className="text-muted text-xs mt-2">
              In Outlook, go to Calendar Settings &rarr; Shared calendars &rarr; Publish a calendar &rarr; Copy the ICS link
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-accent disabled:opacity-50 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
            >
              {saved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-panel p-6">
        <h2 className="text-foreground font-semibold mb-3">How to get your Outlook calendar URL</h2>
        <ol className="space-y-3 text-muted text-sm">
          <li className="flex gap-3">
            <span className="w-6 h-6 admin-panel-soft rounded-full flex items-center justify-center text-xs text-foreground shrink-0">1</span>
            Open Outlook on the web (outlook.office365.com)
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 admin-panel-soft rounded-full flex items-center justify-center text-xs text-foreground shrink-0">2</span>
            Go to Settings (gear icon) &rarr; View all Outlook settings
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 admin-panel-soft rounded-full flex items-center justify-center text-xs text-foreground shrink-0">3</span>
            Navigate to Calendar &rarr; Shared calendars
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 admin-panel-soft rounded-full flex items-center justify-center text-xs text-foreground shrink-0">4</span>
            Under &quot;Publish a calendar&quot;, select the calendar and permission level
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 admin-panel-soft rounded-full flex items-center justify-center text-xs text-foreground shrink-0">5</span>
            Click &quot;Publish&quot; and copy the ICS link
          </li>
        </ol>
      </div>
    </div>
  )
}
