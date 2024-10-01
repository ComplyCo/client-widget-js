import { useContext, useMemo } from "react";
import { AuthContext } from "./Provider";

export const useValidAuth = () => {
  const { authClient } = useContext(AuthContext);

  const res = useMemo(() => {
    return {
      getAuth: async () => {
        return await authClient.config();
      },
      tokenExpired: async (token: string) => {
        await authClient.refreshIfCurrent(token);
      },
      // refresh: async () => {
      //   await authClient.refresh();
      // },
      // notify authClient that the server says the token is expired
    };
  }, []);

  return res;
};

export type UseValidAuth = ReturnType<typeof useValidAuth>;
