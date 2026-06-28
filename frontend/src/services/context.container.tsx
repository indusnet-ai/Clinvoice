import React from "react";

export function container<P, V>(
  useValue: (props: P & { stateOverrides?: any }) => V
) {
  const Context = React.createContext({} as V);
  const Provider: any = (props: any) => {
    const { children } = props;
    const value = useValue(props);
    return <Context.Provider value={value}>{children}</Context.Provider>;
  };
  const useContext = () => React.useContext(Context);
  return {
    useContext,
    Context,
    Provider,
  };
}
