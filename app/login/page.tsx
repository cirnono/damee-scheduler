import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
    title: "登录 — Damee 排班",
    description: "手机号 + 验证码登录",
};

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 px-4">
            <div className="w-full max-w-sm">
                {/* Logo / Brand */}
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-200/50">
                        <span className="text-2xl font-bold text-white">D</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                        Damee 排班
                    </h1>
                    <p className="mt-2 text-sm text-neutral-500">
                        登录后开始管理排班
                    </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <LoginForm />
                </div>
            </div>
        </main>
    );
}
