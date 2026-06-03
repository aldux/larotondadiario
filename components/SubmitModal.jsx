"use client";
import { useState } from 'react';

export default function SubmitModal({ seccion, isOpen, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      const formData = new FormData(e.target);
      const imageFile = formData.get('imagen');
      let imageUrl = "";

      // 1. Subir imagen a ImgBB si se seleccionó una
      if (imageFile && imageFile.size > 0) {
        const imgBbFormData = new FormData();
        imgBbFormData.append("image", imageFile);
        
        // Requiere NEXT_PUBLIC_IMGBB_API_KEY en el .env.local
        const imgBbApiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
        if (!imgBbApiKey) throw new Error("Falta la API Key de ImgBB en la configuración.");

        const imgBbRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgBbApiKey}`, {
          method: 'POST',
          body: imgBbFormData
        });
        
        const imgBbData = await imgBbRes.json();
        if (imgBbData.success) {
          imageUrl = imgBbData.data.url;
        } else {
          throw new Error("Error al subir la imagen a ImgBB");
        }
      }

      // 2. Preparar datos para nuestra API de Google Sheets
      const formValues = {
        titulo: formData.get('titulo'),
        descripcion: formData.get('descripcion'),
        contacto: formData.get('contacto'), // Solo Clasificados
        tipo: formData.get('tipo'),         // Solo Comunidad
        imagen_url: imageUrl
      };

      // 3. Enviar a nuestra API Route
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seccion, formValues })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error(error);
      setErrorMsg(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-rotonda-green-dark dark:text-rotonda-gold mb-6">
          Publicar en {seccion}
        </h2>

        {success ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center font-medium">
            ¡Enviado con éxito! Se publicará una vez aprobado por moderación.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {seccion === 'Comunidad' && (
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tipo de publicación</label>
                <select name="tipo" required className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700">
                  <option value="Noticia Ciudadana">Noticia Ciudadana</option>
                  <option value="Objeto Perdido/Encontrado">Objeto Perdido/Encontrado</option>
                  <option value="Evento Comunitario">Evento Comunitario</option>
                  <option value="Reclamo">Reclamo</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Título</label>
              <input type="text" name="titulo" required className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700" placeholder="Ej: Vendo Bicicleta / Perro perdido" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descripción detallada</label>
              <textarea name="descripcion" required rows="4" className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700" placeholder="Detalles..."></textarea>
            </div>

            {seccion === 'Clasificados' && (
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Contacto (Teléfono/WhatsApp)</label>
                <input type="text" name="contacto" required className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700" placeholder="Ej: 260 4XXXXXX" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Imagen (Opcional pero recomendado)</label>
              <input type="file" name="imagen" accept="image/*" className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700 text-sm" />
            </div>

            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

            <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mt-1">
              <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
                <span className="font-bold">⚠️ Aprobación:</span> Todas las publicaciones son revisadas por nuestro equipo. El tiempo estimado de aprobación es de <strong>2 horas</strong> durante el día, y puede demorar hasta <strong>10 horas</strong> en horario nocturno.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="mt-4 w-full bg-rotonda-gold hover:bg-rotonda-gold-dark text-white font-bold py-3 rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar para aprobación'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
