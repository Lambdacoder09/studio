
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
import { doc, collection, getDocs, query, where, limit } from "firebase/firestore"
import { DUMMY_MEDICINES } from "@/lib/dummy-data"
import { TestTubeDiagonal } from "lucide-react"

export default function LoginPage() {
  const { user } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user && firestore) {
      // Check if user is the test user and seed data if empty
      const checkAndSeed = async () => {
        if (user.email === "test@test.com") {
          const q = query(collection(firestore, "products"), where("ownerId", "==", user.uid), limit(1))
          const querySnapshot = await getDocs(q)
          
          if (querySnapshot.empty) {
            toast({
              title: "Seeding Test Data",
              description: "Populating your inventory with dummy products...",
            })
            
            DUMMY_MEDICINES.forEach(item => {
              const productRef = doc(collection(firestore, "products"))
              setDocumentNonBlocking(productRef, {
                ...item,
                id: productRef.id,
                ownerId: user.uid
              }, { merge: true })
            })
          }
        }

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

      checkAndSeed()
    }
  }, [user, firestore, router, toast])

  const handleAuthError = (error: any) => {
    setIsSubmitting(false)
    // If user doesn't exist for test credentials, attempt sign up
    if (email === "test@test.com" && error.code === "auth/user-not-found") {
       const { initiateEmailSignUp } = require("@/firebase")
       initiateEmailSignUp(auth!, email, password, (err: any) => {
         setIsSubmitting(false)
         toast({ variant: "destructive", title: "Auth Error", description: err.message })
       })
       return
    }

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

  const handleQuickTestLogin = () => {
    const testEmail = "test@test.com"
    const testPass = "123456"
    setEmail(testEmail)
    setPassword(testPass)
    if (!auth) return
    setIsSubmitting(true)
    initiateEmailSignIn(auth, testEmail, testPass, (err) => {
      // If user not found, try to sign up immediately for the test account
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        const { initiateEmailSignUp } = require("@/firebase")
        initiateEmailSignUp(auth, testEmail, testPass, (signupErr: any) => {
          setIsSubmitting(false)
          if (signupErr.code !== "auth/email-already-in-use") {
             toast({ variant: "destructive", title: "Test Login Failed", description: signupErr.message })
          } else {
             // If already exists but pass failed, it's a real auth error
             handleAuthError(signupErr)
          }
        })
      } else {
        handleAuthError(err)
      }
    })
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
                placeholder="••••••••"
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
            
            <div className="relative w-full py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Demo Accounts</span></div>
            </div>

            <Button 
              type="button" 
              variant="secondary" 
              className="w-full h-11 gap-2"
              onClick={handleQuickTestLogin}
              disabled={isSubmitting}
            >
              <TestTubeDiagonal className="h-4 w-4" /> Quick Login (test/123456)
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
