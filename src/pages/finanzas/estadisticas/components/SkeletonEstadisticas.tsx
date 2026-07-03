export function SkeletonEstadisticas() {
  return (
    <div className="px-6 lg:px-8 py-6 space-y-5 animate-pulse">
      <div className="h-20 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-4 h-16 bg-gray-100 rounded-2xl" />
      </div>
      <div className="h-[340px] bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-[270px] bg-gray-100 rounded-2xl" />
        <div className="h-[270px] bg-gray-100 rounded-2xl" />
      </div>
      <div className="h-[300px] bg-gray-100 rounded-2xl" />
      <div className="h-[200px] bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-[160px] bg-gray-100 rounded-2xl" />
        <div className="h-[160px] bg-gray-100 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="h-[140px] bg-gray-100 rounded-2xl" />
        <div className="h-[140px] bg-gray-100 rounded-2xl" />
        <div className="h-[140px] bg-gray-100 rounded-2xl" />
      </div>
      <div className="h-[200px] bg-gray-100 rounded-2xl" />
    </div>
  )
}
