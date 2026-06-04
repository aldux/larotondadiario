"use client";
import { useState, useEffect } from 'react';
import Link from "next/link";
import Logo from "./Logo";

export default function Navbar({ loginButton }) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [weather, setWeather] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
      
      const formattedDate = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      setDate(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-34.6177&longitude=-68.3301&current=temperature_2m,weather_code");
        const data = await res.json();
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code;
        
        let icon = "☀️";
        let desc = "Despejado";
        
        if (code >= 1 && code <= 3) { icon = "🌤️"; desc = "Algo nublado"; }
        if (code >= 45 && code <= 48) { icon = "🌫️"; desc = "Niebla"; }
        if (code >= 51 && code <= 67) { icon = "🌧️"; desc = "Lluvia"; }
        if (code >= 71 && code <= 77) { icon = "❄️"; desc = "Nieve"; }
        if (code >= 80 && code <= 82) { icon = "🌧️"; desc = "Chubascos"; }
        if (code >= 95) { icon = "⛈️"; desc = "Tormenta"; }

        setWeather(`${icon} ${desc}, ${temp}°C`);
      } catch (error) {
        setWeather("☀️ San Rafael");
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 3600000); // 1 hora
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full shadow-sm flex flex-col z-50 sticky top-0">
      {/* Banner LED */}
      <div className="w-full bg-black py-1 overflow-hidden flex items-center">
        <div className="animate-marquee font-mono text-yellow-400 font-bold text-xs sm:text-sm tracking-widest drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]">
          SITIO EN CONSTRUCCIÓN - PERDÓN POR LAS MOLESTIAS - SITIO EN CONSTRUCCIÓN - PERDÓN POR LAS MOLESTIAS - SITIO EN CONSTRUCCIÓN - PERDÓN POR LAS MOLESTIAS
        </div>
      </div>

      {/* Utility Strip */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 flex justify-center items-center gap-4 text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 h-8 border-b border-slate-200 dark:border-slate-700">
        <span className="flex items-center gap-1">📍 San Rafael, Mendoza - {date || "Cargando..."}</span>
        <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
        <span className="flex items-center gap-1">🕒 {time || "--:--"}</span>
        <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
        <span className="flex items-center gap-1">{weather || "Cargando clima..."}</span>
      </div>

      {/* Main Header Row */}
      <div className="w-full bg-white dark:bg-slate-950 py-2 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 flex justify-between items-center h-16">
          
          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center mr-6">
            <Link href="/">
              <Logo width={80} height={80} className="h-20 w-auto" />
            </Link>
          </div>

          {/* Center: Nav Menu */}
          <nav className="flex gap-4 lg:gap-8 items-center flex-grow justify-start lg:justify-center overflow-x-auto no-scrollbar">
            <Link href="/" className="text-[13px] font-bold text-[#004d30] hover:text-rotonda-gold dark:text-gray-300 dark:hover:text-rotonda-gold transition-colors whitespace-nowrap uppercase tracking-wider">PORTADA</Link>
            <Link href="/#locales" className="text-[13px] font-bold text-[#004d30] hover:text-rotonda-gold dark:text-gray-300 dark:hover:text-rotonda-gold transition-colors whitespace-nowrap uppercase tracking-wider">LOCALES</Link>
            <Link href="/#nacionales" className="text-[13px] font-bold text-[#004d30] hover:text-rotonda-gold dark:text-gray-300 dark:hover:text-rotonda-gold transition-colors whitespace-nowrap uppercase tracking-wider">NACIONALES</Link>
            <Link href="/clasificados" className="text-[13px] font-bold text-[#004d30] hover:text-rotonda-gold dark:text-gray-300 dark:hover:text-rotonda-gold transition-colors whitespace-nowrap uppercase tracking-wider">CLASIFICADOS</Link>
            <Link href="/comunidad" className="text-[13px] font-bold text-[#004d30] hover:text-rotonda-gold dark:text-gray-300 dark:hover:text-rotonda-gold transition-colors whitespace-nowrap uppercase tracking-wider">COMUNIDAD</Link>
          </nav>

          {/* Right: Search & Profile */}
          <div className="flex items-center gap-4 flex-shrink-0 ml-4 lg:ml-6">
            <div className="hidden md:flex relative w-48 lg:w-56">
              <input type="text" placeholder="Buscar..." className="w-full bg-slate-100 dark:bg-slate-800 rounded-full py-1.5 px-4 text-xs lg:text-sm focus:outline-none focus:ring-1 focus:ring-rotonda-gold border border-slate-200 dark:border-slate-700 transition-all" />
              <button className="absolute right-3 top-1.5 text-slate-400 hover:text-rotonda-gold transition-colors">
                <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </button>
            </div>
            
            <div className="flex items-center">
              {loginButton}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
