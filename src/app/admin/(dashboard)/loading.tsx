export default function AdminLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />

      {[1, 2, 3].map((section) => (
        <section key={section}>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-gray-200">
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mb-2" />
                <div className="h-9 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="bg-white rounded-xl shadow-sm p-5 h-64 animate-pulse" />
    </div>
  );
}
