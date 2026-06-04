import { signIn, signOut, auth } from "@/auth"

export default async function GoogleLoginButton() {
  const session = await auth()

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
          {session.user.image ? (
            <img 
              src={session.user.image} 
              alt={session.user.name} 
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-rotonda-gold text-white flex items-center justify-center text-xs font-bold">
              {session.user.name?.charAt(0)}
            </div>
          )}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {session.user.name?.split(" ")[0]}
          </span>
        </div>
        <form
          action={async () => {
            "use server"
            await signOut()
          }}
        >
          <button 
            type="submit" 
            className="text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors"
          >
            Salir
          </button>
        </form>
      </div>
    )
  }

  return (
    <form
      action={async () => {
        "use server"
        await signIn("google")
      }}
    >
      <button 
        type="submit" 
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-full shadow-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow transition-all"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Ingresar
      </button>
    </form>
  )
}
