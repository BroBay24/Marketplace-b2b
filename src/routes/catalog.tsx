import { Link, createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '#/components/placeholder-page'
import { buttonVariants } from '#/components/ui/button'

export const Route = createFileRoute('/catalog')({
  component: () => (
    <main className="mx-auto max-w-5xl space-y-8 px-5 py-12">
      <Link to="/" className={buttonVariants({ variant: 'outline' })}>
        ← Beranda
      </Link>
      <PlaceholderPage
        title="Katalog toko"
        description="Temukan kebutuhan usaha dari distributor tepercaya."
      />
    </main>
  ),
})
