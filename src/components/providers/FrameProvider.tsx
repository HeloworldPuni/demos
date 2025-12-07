'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

interface FrameContextType {
  isInMiniApp: boolean;
}

const FrameContext = createContext<FrameContextType>({ isInMiniApp: false });

export const useFrameContext = () => useContext(FrameContext);

export default function FrameProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      sdk.actions.ready();
      setIsSDKLoaded(true);
    };
    if (sdk && !isSDKLoaded) {
      load();
    }
  }, [isSDKLoaded]);

  return (
    <FrameContext.Provider value={{ isInMiniApp: isSDKLoaded }}>
      {children}
    </FrameContext.Provider>
  );
}
