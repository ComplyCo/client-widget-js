import { type ReactElement } from "react";
import { LoggerProvider, type LoggerProviderProps } from "../logger/Provider";
import { AuthProvider, type AuthProviderProps } from "../auth/Provider";

export type CCProviderProps = {
  onError?: LoggerProviderProps["onError"];
  apiConfig: AuthProviderProps["config"];
  children: ReactElement;
};

export function CCProvider({ onError, apiConfig, children }: CCProviderProps) {
  return (
    <LoggerProvider onError={onError}>
      <AuthProvider config={apiConfig}>{children}</AuthProvider>
    </LoggerProvider>
  );
}
