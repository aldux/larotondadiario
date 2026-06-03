import Image from 'next/image';

export default function Logo({ width = 130, height = 130, className = "h-20" }) {
  return (
    <div className="flex items-center justify-center">
      <Image 
        src="/logo.png" 
        alt="La Rotonda Diario" 
        width={width} 
        height={height} 
        className={`${className} w-auto object-contain drop-shadow-md transition-transform duration-300 hover:scale-105`}
        priority
      />
    </div>
  );
}
