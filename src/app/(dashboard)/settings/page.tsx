
"use client"

import { useState } from "react"
import { Building, Shield, Bell, CreditCard, Trash2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Settings</h1>
        <p className="text-muted-foreground">Manage your business profile and application preferences.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <aside className="lg:col-span-1 space-y-1">
          <nav className="flex flex-col gap-1">
            <Button variant="ghost" className="justify-start bg-muted">Business Profile</Button>
            <Button variant="ghost" className="justify-start">Security</Button>
            <Button variant="ghost" className="justify-start">Notifications</Button>
            <Button variant="ghost" className="justify-start">Billing & Plan</Button>
          </nav>
        </aside>

        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> Business Information
              </CardTitle>
              <CardDescription>Update your public business identity and details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="biz-name">Business Name</Label>
                  <Input id="biz-name" defaultValue="BizManager Demo Store" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biz-reg">Registration Number</Label>
                  <Input id="biz-reg" placeholder="BR-12345678" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Base Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD - US Dollar ($)</SelectItem>
                      <SelectItem value="eur">EUR - Euro (€)</SelectItem>
                      <SelectItem value="gbp">GBP - British Pound (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                      <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="bg-primary ml-auto">
                {isSaving ? "Saving..." : "Save Business Details"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-600">
                <Shield className="h-5 w-5" /> Security & Access
              </CardTitle>
              <CardDescription>Manage your account password and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="curr-pass">Current Password</Label>
                <Input id="curr-pass" type="password" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-pass">New Password</Label>
                  <Input id="new-pass" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conf-pass">Confirm New Password</Label>
                  <Input id="conf-pass" type="password" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button onClick={handleSave} variant="outline" disabled={isSaving}>
                Update Password
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-rose-200 bg-rose-50/50 shadow-none">
            <CardHeader>
              <CardTitle className="text-rose-700 flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Danger Zone
              </CardTitle>
              <CardDescription className="text-rose-600/80">
                Irreversible actions that affect your entire business data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-rose-800">Reset All Data</p>
                  <p className="text-sm text-rose-700/70">Wipe all inventory, sales, and expense records.</p>
                </div>
                <Button variant="destructive">Reset Data</Button>
              </div>
              <Separator className="bg-rose-200" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-rose-800">Delete Account</p>
                  <p className="text-sm text-rose-700/70">Permanently remove your account and all business info.</p>
                </div>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
