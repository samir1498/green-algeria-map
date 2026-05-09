import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Explore Reforestation</h1>
        <p className="mt-2 text-gray-600">Track tree planting initiatives and green coverage across Algeria.</p>
      </div>

      <div className="border rounded-lg bg-gray-50 h-[500px] flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="9 6.75v12m6-6v-6.75m-3 3H15m-3 0v-1.5M12 9v8.25m0-8.25h3.75M12 18h3.75M9.75 9h4.5M9.75 9a2.25 2.25 0 1 1 0 4.5h-4.5v3h4.5ZM12 9v6" />
          </svg>
          <p className="mt-4 text-gray-500 font-medium">Map View</p>
          <p className="mt-1 text-sm text-gray-400">Interactive map coming soon</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6 bg-white">
          <div className="text-2xl font-bold text-green-600">0</div>
          <div className="mt-1 text-sm text-gray-500">Active Projects</div>
        </div>
        <div className="border rounded-lg p-6 bg-white">
          <div className="text-2xl font-bold text-green-600">0</div>
          <div className="mt-1 text-sm text-gray-500">Trees Planted</div>
        </div>
        <div className="border rounded-lg p-6 bg-white">
          <div className="text-2xl font-bold text-green-600">0 ha</div>
          <div className="mt-1 text-sm text-gray-500">Area Covered</div>
        </div>
      </div>
    </div>
  )
}