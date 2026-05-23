import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/button'

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-muted-foreground text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">This page could not be found.</p>
        <Link to="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </div>
  )
}
