import { Hexagon } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-[#0a0a0a]/80 border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hexagon className="w-8 h-8 text-orange-500" />
          <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
            La Rotonda
          </span>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-5 py-2 rounded-full transition-colors shadow-sm">
          Publicar Gratis
        </button>
      </div>
    </header>
  );
}
