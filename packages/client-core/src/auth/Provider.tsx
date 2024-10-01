import { createContext, useState, type FC, type ReactElement, useEffect } from "react";
import ClientAuth, { type AuthConfigFn } from "./clientAuth";

type AuthContextState = {
  authClient: ClientAuth;
};

const defaultAuthContextState: AuthContextState = {
  authClient: new ClientAuth(),
};

export const AuthContext = createContext<AuthContextState>(defaultAuthContextState);

export type AuthProviderProps = {
  config: AuthConfigFn;
  children: ReactElement;
};
export const AuthProvider: FC<AuthProviderProps> = (props) => {
  const [authClient] = useState<ClientAuth>(() => {
    return new ClientAuth(props.config);
  });

  useEffect(() => {
    authClient.setConfigFn(props.config);
  }, [props.config]);

  return <AuthContext.Provider value={{ authClient }}>{props.children}</AuthContext.Provider>;
};
