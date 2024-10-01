import { createContext, useState, type FC, type ReactElement, useEffect } from "react";

export type LoggerContextState = {
  onError: (error: Error) => void;
};

const defaultLoggerContextState: LoggerContextState = {
  onError: (error: Error) => {
    console.error("[ComplyCo]: ", error);
  },
};

export const LoggerContext = createContext<LoggerContextState>(defaultLoggerContextState);

export type LoggerProviderProps = {
  onError?: (error: Error) => void;
  children: ReactElement;
};
export const LoggerProvider: FC<LoggerProviderProps> = (props) => {
  const [state, setState] = useState<LoggerContextState>(() => {
    return {
      onError: props.onError || defaultLoggerContextState.onError,
    };
  });

  useEffect(() => {
    setState({
      onError: props.onError || defaultLoggerContextState.onError,
    });
  }, [props.onError]);

  return <LoggerContext.Provider value={state}>{props.children}</LoggerContext.Provider>;
};
