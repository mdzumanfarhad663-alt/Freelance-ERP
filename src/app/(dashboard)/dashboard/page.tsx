export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Overview of your freelance business.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Clients", "Active Projects", "Open Tasks", "Unpaid Invoices"].map((label) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">—</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
        <p className="text-sm font-medium text-gray-900">Welcome to Freelance ERP OS</p>
        <p className="mt-1 text-sm text-gray-500">Reports and activity will appear here in Phase 2.</p>
      </div>
    </div>
  );
}
