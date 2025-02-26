import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

export default function SignIn() {
  const router = useRouter();
  const { error } = router.query;

  return (
    <div className="signin-container">
      <div className="signin-card">
        <h1>Авторизация</h1>
        {error && (
          <div className="error-message">
            {error === "AccessDenied" 
              ? "У вас нет доступа к этому приложению." 
              : "Произошла ошибка при входе."}
          </div>
        )}
        <button onClick={() => signIn("google", { callbackUrl: "/" })} className="signin-button">
          Войти через Google
        </button>
      </div>

      <style jsx>{`
        .signin-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f4f4f9;
        }
        .signin-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          text-align: center;
          width: 90%;
          max-width: 400px;
        }
        h1 {
          margin-bottom: 1.5rem;
          color: #333;
        }
        .signin-button {
          background-color: #4285F4;
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .signin-button:hover {
          background-color: #357ae8;
        }
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 0.8rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}