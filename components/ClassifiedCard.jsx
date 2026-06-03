import { MessageCircle } from "lucide-react";
import Link from "next/link";

export default function ClassifiedCard({ id, image, title, price, contact }) {
  const cleanContact = contact ? contact.replace(/\D/g, '') : '';
  const waLink = cleanContact ? `https://wa.me/${cleanContact}?text=Hola, vi tu aviso en La Rotonda sobre: ${encodeURIComponent(title)}` : '#';
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800 mb-4 flex flex-col gap-3 hover:shadow-md transition-shadow group">
      <Link href={id ? `/clasificados/${id}` : '#'} className="flex gap-3 cursor-pointer">
        <div className="w-20 h-20 shrink-0 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
          {image && (
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex flex-col justify-center">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight group-hover:text-rotonda-green-dark dark:group-hover:text-rotonda-gold transition-colors">
            {title}
          </h3>
          <p className="text-lg font-black text-rotonda-gold mt-1 line-clamp-1">
            {price}
          </p>
        </div>
      </Link>
      {cleanContact ? (
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5A] text-white font-medium py-2 rounded-lg transition-colors">
          <MessageCircle className="w-5 h-5" />
          Contactar por WhatsApp
        </a>
      ) : (
        <button disabled className="w-full flex items-center justify-center gap-2 bg-gray-300 text-white font-medium py-2 rounded-lg cursor-not-allowed">
          <MessageCircle className="w-5 h-5" />
          Sin contacto
        </button>
      )}
    </div>
  );
}
