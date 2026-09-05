import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Boxes } from 'lucide-react'
import { env } from '#/env'
import { Button, buttonVariants } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

export const Route = createFileRoute('/login')({ component: Login })
function Login() {
  const [message, setMessage] = useState('')
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 flex justify-center gap-2 text-xl font-extrabold"
        >
          <Boxes className="text-emerald-700" />
          {env.VITE_APP_NAME}
        </Link>
        <Card>
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold">Selamat datang kembali</h1>
            <p className="mt-2 text-sm text-slate-500">
              Masuk ke ruang kerja distributor Anda.
            </p>
            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                setMessage(
                  'Ini form demonstrasi. Tidak ada autentikasi atau data yang dikirim.',
                )
              }}
            >
              <div>
                <Label htmlFor="email" className="mb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@perusahaan.id"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="mb-2">
                  Kata sandi
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Masuk (demo)
              </Button>
              <p role="status" className="text-sm text-emerald-800">
                {message}
              </p>
            </form>
            <div className="mt-6 border-t pt-6">
              <p className="mb-3 text-xs leading-5 text-slate-500">
                Autentikasi belum tersedia. Anda dapat langsung menjelajahi
                dashboard demo.
              </p>
              <Link
                to="/dashboard"
                className={buttonVariants({
                  variant: 'outline',
                  className: 'w-full',
                })}
              >
                Buka dashboard demo
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
