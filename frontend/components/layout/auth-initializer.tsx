"use client";

import { useEffect } from "react";

import { useAppDispatch } from "@/lib/hooks";
import { useGetMeQuery } from "@/lib/features/auth/auth.api";
import {
  setAuthenticatedUser,
  setAuthLoading,
  setUnauthenticated,
} from "@/lib/features/auth/auth.slice";

export function AuthInitializer() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isError } = useGetMeQuery();

  useEffect(() => {
    if (isLoading) {
      dispatch(setAuthLoading());
    } else if (data?.data) {
      dispatch(setAuthenticatedUser(data.data));
    } else if (isError) {
      dispatch(setUnauthenticated());
    }
  }, [data, dispatch, isError, isLoading]);

  return null;
}
