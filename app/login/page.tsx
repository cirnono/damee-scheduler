import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
    title: "登录 — Damee 排班",
    description: "手机号 + 验证码登录",
};

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-neutral-900">
                        Damee 排班
                    </h1>
                    <p className="mt-2 text-sm text-neutral-500">
                        登录后开始管理排班
                    </p>
                </div>
                <LoginForm />
            </div>
        </main>
    );
}
