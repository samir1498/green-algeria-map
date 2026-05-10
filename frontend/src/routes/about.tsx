import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground">About</h1>
      <div className="mt-6 prose dark:prose-invert">
        <p className="text-muted-foreground">
          Green Algeria Map is a platform dedicated to tracking and visualizing
          reforestation efforts across Algeria. Our goal is to monitor tree planting
          initiatives, visualize green coverage, and support environmental restoration projects.
        </p>
        <h2 className="text-xl font-semibold mt-6 text-foreground">Mission</h2>
        <p className="text-muted-foreground">
          To provide transparent, accessible data on Algeria's reforestation efforts
          and encourage community participation in environmental restoration.
        </p>
        <h2 className="text-xl font-semibold mt-6 text-foreground">How It Works</h2>
        <p className="text-muted-foreground">
          We collect and visualize data on tree planting locations, coverage statistics,
          and regional progress. The platform serves as a central hub for tracking
          the impact of reforestation initiatives.
        </p>
      </div>
    </div>
  )
}