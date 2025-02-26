// components/Layout.js
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Layout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === "loading";

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

  return (
    <div className="layout">
      <header className="header">
        <button className="toggle-view-button" onClick={toggleView}>
          ВИД: {router.pathname === "/" ? "Главное" : "Подробно"}
        </button>
        <div className="user-info">
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
      </header>
      <main className="main-content">{children}</main>

      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
