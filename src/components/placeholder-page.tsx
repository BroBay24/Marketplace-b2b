import { PackageOpen } from 'lucide-react'
import { Card, CardContent } from '#/components/ui/card'
import { PageHeading } from '#/components/page-heading'

export function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <>
      <PageHeading title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-20 text-center">
          <PackageOpen className="mb-5 text-emerald-700" size={40} />
          <h2 className="text-lg font-semibold">
            Ruang untuk langkah berikutnya
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            Modul {title.toLowerCase()} sedang disiapkan. Halaman ini merupakan
            placeholder pada baseline demonstrasi.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
