"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { clearTokens, getAccessToken, setTokens, type TokenData, type User } from "@/lib/auth";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = typeof window !== "undefined" ? getAccessToken() : null;

  const userQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiRequest<User>("/auth/me", { token }),
    enabled: !!token,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiRequest<TokenData>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (tokens) => {
      setTokens(tokens);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.push("/dashboard");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: { email: string; password: string; full_name?: string }) =>
      apiRequest<User>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      router.push("/login");
    },
  });

  const logout = () => {
    clearTokens();
    queryClient.clear();
    router.push("/login");
  };

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isAuthenticated: !!token,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout,
  };
}
