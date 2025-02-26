import { useRouter } from "next/router";
import Link from "next/link";

export default function Error() {
  const router = useRouter();
  const { error } = router.query;

  return (
    <div className="error-container">
      <div className="error-card">
        <h1>Ошибка авторизации</h1>
        <p>
          {error === "AccessDenied"
            ? "У вас нет доступа к этому приложению. Пожалуйста, используйте аккаунт из списка разрешенных."
            : "Произошла ошибка при авторизации. Пожалуйста, попробуйте снова."}
        </p>
        <Link href="/auth/signin">
          <a className="back-button">Вернуться на страницу входа</a>
        </Link>
      </div>

      <style jsx>{`
        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f4f4f9;
        }
        .error-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          text-align: center;
          width: 90%;
          max-width: 400px;
        }
        h1 {
          margin-bottom: 1rem;
          color: #c62828;
        }
        p {
          margin-bottom: 1.5rem;
          color: #333;
        }
        .back-button {
          display: inline-block;
          background-color: #4285F4;
          color: white;
          text-decoration: none;
          padding: 0.8rem 1.5rem;
          border-radius: 4px;
          font-size: 1rem;
          transition: background-color 0.3s;
        }
        .back-button:hover {
          background-color: #357ae8;
        }
      `}</style>
    </div>
  );
}
