"use client";
import { useState, useEffect } from 'react';
import Link from "next/link";
import Logo from "./Logo";

export default function Navbar() {
  const [time, setTime] = useState("");
  const [weather, setWeather] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
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
    <header className="w-full bg-white dark:bg-slate-950 border-b-4 border-rotonda-gold shadow-sm flex flex-col">
      {/* Nivel 1: Logo Centrado */}
      <div className="flex justify-center items-center pt-8 pb-3">
        <Link href="/">
          <Logo width={250} height={250} className="h-40 sm:h-48" />
        </Link>
      </div>

      {/* Nivel 2: Franja Informativa */}
      <div className="flex justify-center items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 pb-6 flex-wrap">
        <span className="flex items-center gap-1">📍 San Rafael, Mendoza</span>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
        <span className="flex items-center gap-1">🕒 {time || "--:--"}</span>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
        <span className="flex items-center gap-1">{weather || "Cargando clima..."}</span>
      </div>

      {/* Nivel 3: Botonera Pegajosa (Sticky) */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            
            {/* Navegación principal */}
            <nav className="flex gap-6 sm:gap-8 items-center overflow-x-auto w-full sm:w-auto no-scrollbar">
              <Link href="/" className="text-sm font-bold text-rotonda-green-dark hover:text-rotonda-gold dark:text-gray-300 dark:hover:text-rotonda-gold transition-colors whitespace-nowrap uppercase tracking-wider">
                Portada
              </Link>
              <Link href="/#locales" className="text-sm font-bold text-rotonda-green-dark hover:text-rotonda-gold dark:text-gray-300 dark:hover:text-rotonda-gold transition-colors whitespace-nowrap uppercase tracking-wider">
                Locales
              </Link>
              <Link href="/#nacionales" className="text-sm font-bold text-rotonda-green-dark hover:text-rotonda-gold dark:text-gray-300 dark:hover:text-rotonda-gold transition-colors whitespace-nowrap uppercase tracking-wider">
                Nacionales
              </Link>
              <Link href="/clasificados" className="text-sm font-bold text-rotonda-green-dark hover:text-rotonda-gold dark:text-gray-300 dark:hover:text-rotonda-gold transition-colors whitespace-nowrap uppercase tracking-wider">
                Clasificados
              </Link>
              <Link href="/comunidad" className="text-sm font-bold text-rotonda-green-dark hover:text-rotonda-gold dark:text-gray-300 dark:hover:text-rotonda-gold transition-colors whitespace-nowrap uppercase tracking-wider">
                Comunidad
              </Link>
            </nav>

            {/* Buscador */}
            <div className="hidden md:flex relative w-64 ml-4">
              <input type="text" placeholder="Buscar..." className="w-full bg-slate-100 dark:bg-slate-800 rounded-full py-1.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-rotonda-gold border border-transparent transition-all" />
              <button className="absolute right-3 top-1.5 text-slate-400 hover:text-rotonda-gold transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </header>
  );
}
