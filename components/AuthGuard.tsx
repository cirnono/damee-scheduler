"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // One-time mount gate — must run after hydration to access localStorage.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);

        const auth = localStorage.getItem("damee-scheduler-auth");
        if (auth !== "skipped") {
            router.replace("/login");
        }
    }, [router]);

    if (!mounted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-amber-500" />
                    <p className="mt-4 text-sm text-neutral-400">加载中…</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
