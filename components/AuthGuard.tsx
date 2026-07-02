"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthGuardState = "loading" | "authenticated" | "unauthenticated";

function getInitialState(): AuthGuardState {
    if (typeof window === "undefined") return "loading";
    return localStorage.getItem("damee-scheduler-auth") === "skipped"
        ? "authenticated"
        : "unauthenticated";
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [state] = useState<AuthGuardState>(getInitialState);

    useEffect(() => {
        if (state === "unauthenticated") {
            router.replace("/login");
        }
    }, [state, router]);

    if (state === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-amber-500" />
                    <p className="mt-4 text-sm text-neutral-400">加载中…</p>
                </div>
            </div>
        );
    }

    if (state === "unauthenticated") {
        return null;
    }

    return <>{children}</>;
}
