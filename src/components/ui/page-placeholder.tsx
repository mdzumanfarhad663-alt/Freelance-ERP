export function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

      <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
        <p className="text-sm font-medium text-gray-900">Nothing here yet</p>
        <p className="mt-1 text-sm text-gray-500">This module is coming in Phase 2.</p>
      </div>
    </div>
  );
}
