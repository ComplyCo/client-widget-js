import { useContext } from "react";
import { LoggerContext } from "./Provider";

export const useLogger = () => {
  const context = useContext(LoggerContext);

  return context;
};

export type UseLogger = ReturnType<typeof useLogger>;
