"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <Button onClick={handleLogout} variant="outline" className="rounded-xl bg-transparent" disabled={isLoading}>
      <LogOut className="mr-2" size={16} />
      {isLoading ? "Cerrando..." : "Cerrar Sesión"}
    </Button>
  )
}
