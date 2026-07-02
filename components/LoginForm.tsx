"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const COUNTRY_CODES = [
  { code: "+61", label: "AU", digits: 9 },
  { code: "+86", label: "CN", digits: 11 },
] as const;

export function LoginForm() {
  const router = useRouter();
  const codeRef = useRef<HTMLInputElement>(null);
  const [countryIdx, setCountryIdx] = useState(0);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const country = COUNTRY_CODES[countryIdx];
  const phoneValid = new RegExp(`^\\d{${country.digits}}$`).test(phone);
  const codeValid = /^\d{6}$/.test(code);
  const e164Phone = `${country.code}${phone}`;

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

    // TODO: POST /api/send-code { phone: e164Phone }
    console.log("Sending code to", e164Phone);
    setTimeout(() => {
      setSending(false);
      startCountdown();
      codeRef.current?.focus();
    }, 800);
  }

  function handleLogin() {
    if (!phoneValid || !codeValid || loading) return;
    setLoading(true);
    setError("");

    // TODO: POST /api/login { phone: e164Phone, code }
    // Mock: 模拟登录成功
    console.log("Logging in with", e164Phone, code);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("damee-scheduler-auth", "skipped");
      localStorage.setItem("damee-scheduler-user", e164Phone);
      router.replace("/");
    }, 1000);
  }

  function handleSkip() {
    localStorage.setItem("damee-scheduler-auth", "skipped");
    localStorage.setItem("damee-scheduler-user", e164Phone);
    router.replace("/");
  }

  /** Auto-submit when code reaches 6 digits */
  const prevCodeLengthRef = useRef(0);
  useEffect(() => {
    if (code.length === 6 && prevCodeLengthRef.current !== 6 && phoneValid) {
      handleLogin();
    }
    prevCodeLengthRef.current = code.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, phoneValid]);

  return (
    <div className="space-y-5">
      {/* 手机号 */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-neutral-600"
        >
          手机号
        </label>
        <div className="relative mt-1.5 flex">
          <select
            value={countryIdx}
            onChange={(e) => {
              setCountryIdx(Number(e.target.value));
              setPhone("");
              setError("");
            }}
            className="shrink-0 rounded-xl border border-neutral-300 bg-neutral-50 py-2.5 pl-3 pr-7 text-sm text-neutral-700 outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
          >
            {COUNTRY_CODES.map((c, i) => (
              <option key={c.code} value={i}>
                {c.code} {c.label}
              </option>
            ))}
          </select>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => {
              const v = e.target.value
                .replace(/\D/g, "")
                .slice(0, country.digits);
              setPhone(v);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && phone.length === country.digits) {
                codeRef.current?.focus();
              }
            }}
            placeholder={country.code === "+61" ? "4xxxxxxxx" : "1xxxxxxxxxx"}
            className="ml-2 block flex-1 rounded-xl border border-neutral-300 bg-white py-2.5 pl-3 pr-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        {phone.length > 0 && !phoneValid && (
          <p className="mt-1.5 text-xs text-red-500">
            {country.code === "+61"
              ? "请输入 9 位澳洲手机号（去除首位 0）"
              : "请输入 11 位手机号"}
          </p>
        )}
        {phone.length > 0 && phoneValid && (
          <p className="mt-1.5 text-xs text-emerald-600">
            ✓ 手机号格式正确（{e164Phone}）
          </p>
        )}
      </div>

      {/* 验证码 */}
      <div>
        <label
          htmlFor="code"
          className="block text-sm font-medium text-neutral-600"
        >
          验证码
        </label>
        <div className="mt-1.5 flex gap-3">
          <input
            ref={codeRef}
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(v);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && codeValid) handleLogin();
            }}
            placeholder="6 位验证码"
            className="block flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={!phoneValid || sending || countdown > 0}
            className={
              !phoneValid || sending || countdown > 0
                ? "shrink-0 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-400"
                : "shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 active:bg-amber-200"
            }
          >
            {countdown > 0
              ? `${countdown}s`
              : sending
                ? "发送中…"
                : "发送验证码"}
          </button>
        </div>
        {code.length > 0 && !codeValid && (
          <p className="mt-1.5 text-xs text-red-500">请输入 6 位验证码</p>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="animate-slide-down rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* 登录按钮 */}
      <button
        type="button"
        onClick={handleLogin}
        disabled={!phoneValid || !codeValid || loading}
        className={
          !phoneValid || !codeValid || loading
            ? "w-full rounded-xl bg-neutral-100 py-2.5 text-sm font-semibold text-neutral-400"
            : "w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-neutral-950 shadow-sm transition-colors hover:bg-amber-400 active:bg-amber-600"
        }
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            登录中…
          </span>
        ) : (
          "登录"
        )}
      </button>

      {/* 分隔线 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-100" />
        </div>
        <div className="relative flex justify-center text-xs text-neutral-400">
          <span className="bg-white px-2">开发模式</span>
        </div>
      </div>

      {/* 跳过按钮 */}
      <button
        type="button"
        onClick={handleSkip}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 py-2.5 text-sm text-neutral-400 transition-colors hover:border-amber-300 hover:text-amber-600"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
        跳过登录 → 进入应用
      </button>
    </div>
  );
}
