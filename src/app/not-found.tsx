import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-[#0b1320] text-gray-100">
      <h1 className="text-6xl font-bold text-amber-400 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-gray-400 max-w-md mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
