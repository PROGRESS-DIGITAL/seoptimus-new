import Aurora from "@/components/Aurora";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Вход — SEOPTIMUS", robots: { index: false } };

export default function Login() {
  return (
    <div className="relative grid min-h-[70vh] place-items-center overflow-hidden px-4 py-16">
      <Aurora />
      <div className="glow w-full max-w-sm animate-rise rounded-3xl">
        <div className="glass p-8">
          <h1 className="display text-2xl">Вход и регистрация</h1>
          <p className="mt-2 text-sm text-muted">Пришлём код на почту, пароль не нужен. Новым пользователям 50 кредитов.</p>
          <div className="mt-7">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
