import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Вход — SEOPTIMUS", robots: { index: false } };

export default function Login() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">Вход и регистрация</h1>
      <p className="mt-2 text-sm text-slate-600">Пришлём код на почту. Новым пользователям 50 кредитов в подарок.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
