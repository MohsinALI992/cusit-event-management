import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth(requireAuth = true) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading, error } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    }
  });

  useEffect(() => {
    if (!isLoading && requireAuth && (!user || error)) {
      setLocation("/login");
    } else if (!isLoading && !requireAuth && user && !error) {
      setLocation("/");
    }
  }, [user, isLoading, error, requireAuth, setLocation]);

  return { user, isLoading };
}
