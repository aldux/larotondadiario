export default function NewsCard({ image, title, summary, link }) {
  const CardContent = (
    <article className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 mb-6 border border-gray-100 dark:border-gray-800 group-hover:-translate-y-1">
      {image && (
        <div className="w-full aspect-[16/9] bg-gray-200 dark:bg-gray-800 overflow-hidden relative">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      )}
      <div className="p-5">
        <h2 className="text-xl font-bold mb-2 text-rotonda-green-dark dark:text-gray-100 leading-snug group-hover:text-rotonda-gold transition-colors">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed line-clamp-3">
          {summary}
        </p>
      </div>
    </article>
  );

  // Si pasamos un link, envolvemos toda la tarjeta para que sea cliqueable
  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className="block cursor-pointer group">
        {CardContent}
      </a>
    );
  }

  return CardContent;
}
