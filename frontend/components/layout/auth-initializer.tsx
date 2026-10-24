"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAppDispatch } from "@/lib/hooks";
import { useGetMeQuery } from "@/lib/features/auth/auth.api";
import {
  setAuthenticatedUser,
  setAuthLoading,
  setUnauthenticated,
} from "@/lib/features/auth/auth.slice";

export function AuthInitializer() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data, isLoading, isError } = useGetMeQuery();

  useEffect(() => {
    if (isLoading) {
      dispatch(setAuthLoading());
    } else if (data?.data) {
      dispatch(setAuthenticatedUser(data.data));
    } else if (isError || !data?.data) {
      dispatch(setUnauthenticated());
    }
  }, [data, dispatch, isError, isLoading]);

  useEffect(() => {
    const handleAuthExpired = () => router.replace("/login");
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, [router]);

  return null;
}
