import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-charcoal-900 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="text-6xl">🏔️</div>
        <h1 className="text-3xl font-bold text-white font-sans">Page Not Found</h1>
        <p className="text-gray-400 font-mono">Lost in the mountains?</p>
        <Link
          href="/"
          className="inline-block mt-4 bg-amber-400 text-charcoal-900 font-bold px-6 py-3 rounded-lg hover:bg-amber-500 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
