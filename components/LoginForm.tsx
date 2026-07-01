"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function LoginForm() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const phoneValid = /^1\d{10}$/.test(phone);
    const codeValid = /^\d{6}$/.test(code);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startCountdown = useCallback(() => {
        setCountdown(60);

        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    timerRef.current = null;

                    return 0;
                }

                return prev - 1;
            });
        }, 1000);
    }, []);

    function handleSendCode() {
        if (!phoneValid || sending || countdown > 0) return;

        setSending(true);
        setError("");

        // TODO: 对接后端验证码接口
        // POST /api/send-code { phone }
        setTimeout(() => {
            setSending(false);
            startCountdown();
        }, 800);
    }

    function handleLogin() {
        if (!phoneValid || !codeValid || loading) return;

        setLoading(true);
        setError("");

        // TODO: 对接后端登录接口
        // POST /api/login { phone, code }
        setTimeout(() => {
            setLoading(false);
            setError("验证码错误，请重试");
        }, 1000);
    }

    function handleSkip() {
        localStorage.setItem("damee-scheduler-auth", "skipped");
        router.replace("/");
    }

    return (
        <div className="space-y-5">
            {/* 手机号 */}
            <div>
                <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-neutral-700"
                >
                    手机号
                </label>
                <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                        setPhone(v);
                        setError("");
                    }}
                    placeholder="请输入手机号"
                    className="mt-1.5 block w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                {phone.length > 0 && !phoneValid && (
                    <p className="mt-1 text-xs text-red-500">
                        请输入 11 位手机号
                    </p>
                )}
            </div>

            {/* 验证码 */}
            <div>
                <label
                    htmlFor="code"
                    className="block text-sm font-medium text-neutral-700"
                >
                    验证码
                </label>
                <div className="mt-1.5 flex gap-3">
                    <input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        value={code}
                        onChange={(e) => {
                            const v = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6);
                            setCode(v);
                            setError("");
                        }}
                        placeholder="6 位验证码"
                        className="block flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={!phoneValid || sending || countdown > 0}
                        className={
                            !phoneValid || sending || countdown > 0
                                ? "shrink-0 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2.5 text-sm text-neutral-400"
                                : "shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
                        }
                    >
                        {countdown > 0
                            ? `${countdown}s`
                            : sending
                              ? "发送中…"
                              : "发送验证码"}
                    </button>
                </div>
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* 登录按钮 */}
            <button
                type="button"
                onClick={handleLogin}
                disabled={!phoneValid || !codeValid || loading}
                className={
                    !phoneValid || !codeValid || loading
                        ? "w-full rounded-xl bg-neutral-200 py-2.5 text-sm font-semibold text-neutral-400"
                        : "w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
                }
            >
                {loading ? "登录中…" : "登录"}
            </button>

            {/* 分隔线 */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-xs text-neutral-400">
                    <span className="bg-neutral-50 px-2">开发模式</span>
                </div>
            </div>

            {/* 跳过按钮 */}
            <button
                type="button"
                onClick={handleSkip}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 py-2.5 text-sm text-neutral-500 hover:border-amber-300 hover:text-amber-600"
            >
                <span>跳过登录 → 进入应用</span>
            </button>
        </div>
    );
}
