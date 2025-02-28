// components/Layout.js
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Layout({ children, title = "Tuya Dashboard" }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === "loading";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      router.push("/auth/signin");
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const toggleView = () => {
    if (router.pathname === "/") {
      router.push("/details");
    } else {
      router.push("/");
    }
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Link href="/">
              <a className="logo-text">Tuya</a>
            </Link>
          </div>

          <button className="toggle-view-button desktop-only" onClick={toggleView}>
            ВИД: {router.pathname === "/" ? "Главное" : "Подробно"}
          </button>
          
          <div className="user-info desktop-only">
            {session.user.image && (
              <img 
                src={session.user.image} 
                alt={session.user.name} 
                className="user-avatar"
              />
            )}
            <span className="user-name">{session.user.name}</span>
            <button onClick={() => signOut()} className="logout-button">
              Выйти
            </button>
          </div>
          
          <button 
            className="mobile-menu-button mobile-only" 
            onClick={toggleMobileMenu}
            aria-label="Меню"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        
        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <button className="mobile-toggle-view" onClick={toggleView}>
              ВИД: {router.pathname === "/" ? "Главное" : "Подробно"}
            </button>
            <div className="mobile-user-info">
              {session.user.image && (
                <img 
                  src={session.user.image} 
                  alt={session.user.name} 
                  className="user-avatar"
                />
              )}
              <span className="user-name">{session.user.name}</span>
            </div>
            <button onClick={() => signOut()} className="mobile-logout-button">
              Выйти
            </button>
          </div>
        )}
      </header>
      
      <main className="main-content">
        {children}
      </main>

      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .header {
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .logo {
          font-size: 1.5rem;
          font-weight: bold;
        }
        .logo-text {
          color: #2196f3;
          text-decoration: none;
        }
        .toggle-view-button {
          background-color: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .toggle-view-button:hover {
          background-color: #1976d2;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
        }
        .user-name {
          font-size: 0.9rem;
          color: #333;
        }
        .logout-button {
          background-color: #f44336;
          color: white;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .logout-button:hover {
          background-color: #d32f2f;
        }
        .main-content {
          flex: 1;
          background-color: #f4f4f9;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 0 1rem;
        }
        .page-title-container {
          padding: 1rem 0;
        }
        .page-title-container h1 {
          margin: 0;
          color: #333;
        }
        
        /* Мобильное меню */
        .mobile-menu-button {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 30px;
          height: 20px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .mobile-menu-button span {
          width: 100%;
          height: 3px;
          background-color: #333;
          border-radius: 3px;
        }
        .mobile-menu {
          padding: 1rem;
          background-color: #fff;
          border-top: 1px solid #eee;
          display: none;
        }
        .mobile-toggle-view {
          background-color: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
          margin-bottom: 1rem;
        }
        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .mobile-logout-button {
          background-color: #f44336;
          color: white;
          border: none;
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.9rem;
          cursor: pointer;
          width: 100%;
        }
        
        /* Адаптивность */
        @media (max-width: 768px) {
          .desktop-only {
            display: none;
          }
          .mobile-only {
            display: flex;
          }
          .mobile-menu {
            display: block;
          }
          .header-content {
            padding: 0.8rem;
          }
          .main-content {
            padding: 0 0.5rem;
          }
        }
        
        @media (min-width: 769px) {
          .desktop-only {
            display: flex;
          }
          .mobile-only {
            display: none;
          }
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f4f4f9;
        }
        .loading {
          font-size: 1.2rem;
          color: #555;
        }
      `}</style>
    </div>
  );
}