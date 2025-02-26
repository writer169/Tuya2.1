import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Временная отладка для проверки переменных окружения
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET);
console.log("ALLOWED_EMAILS:", process.env.ALLOWED_EMAILS);

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email }) {
      // Список разрешенных email адресов
      const allowedEmails = process.env.ALLOWED_EMAILS
        ? process.env.ALLOWED_EMAILS.split(",").map((email) => email.trim())
        : [];

      // Если список пуст, разрешаем всем, иначе проверяем наличие email в списке
      return allowedEmails.length === 0 || allowedEmails.includes(user.email);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin", // Кастомная страница входа
    error: "/auth/error",   // Кастомная страница ошибки
  },
});