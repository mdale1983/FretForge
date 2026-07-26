import { useCallback, useRef, useState } from "react";

export function useAsyncAction() {
  const pendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const run = useCallback(
    async <T,>(action: () => Promise<T>, fallbackMessage: string) => {
      if (pendingRef.current) return undefined;

      pendingRef.current = true;
      setIsPending(true);
      setErrorMessage("");

      try {
        return await action();
      } catch (error) {
        console.error(fallbackMessage, error);
        setErrorMessage(fallbackMessage);
        return undefined;
      } finally {
        pendingRef.current = false;
        setIsPending(false);
      }
    },
    []
  );

  return { run, isPending, errorMessage };
}
