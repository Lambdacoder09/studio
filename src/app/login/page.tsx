
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useAuth, useUser, initiateEmailSignIn, initiateAnonymousSignIn, setDocumentNonBlocking, useFirestore } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { doc, collection } from "firebase/firestore"

export default function LoginPage() {
  const { user } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("demo@example.com")
  const [password, setPassword] = useState("password123")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in and log the event
  useEffect(() => {
    if (user && firestore) {
      // Log successful login
      const logRef = doc(collection(firestore, "logs"))
      setDocumentNonBlocking(logRef, {
        id: logRef.id,
        ownerId: user.uid,
        type: "auth",
        action: `User signed in: ${user.email || 'Anonymous Guest'}`,
        timestamp: new Date().toISOString()
      }, { merge: true })

      router.push("/dashboard")
    }
  }, [user, firestore, router])

  const handleAuthError = (error: any) => {
    setIsSubmitting(false)
    toast({
      variant: "destructive",
      title: "Authentication Error",
      description: error.message || "An unexpected error occurred during sign-in.",
    })
  }

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth) return
    setIsSubmitting(true)
    initiateEmailSignIn(auth, email, password, handleAuthError)
  }

  const handleGuestSignIn = () => {
    if (!auth) return
    setIsSubmitting(true)
    initiateAnonymousSignIn(auth, handleAuthError)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white text-2xl font-bold mb-4">
            B
          </div>
          <CardTitle className="text-2xl font-bold">BizManager Login</CardTitle>
          <CardDescription>Enter your credentials to manage your business</CardDescription>
        </CardHeader>
        <form onSubmit={handleEmailSignIn}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="owner@bizmanager.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4">
            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-11"
              onClick={handleGuestSignIn}
              disabled={isSubmitting}
            >
              Sign in as Guest
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">Register business</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
