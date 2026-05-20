import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
        <p className="text-muted-foreground">This page could not be found.</p>
        <Link to="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </div>
  )
}
