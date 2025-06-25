import React, { createContext, useContext, useRef } from "react";
import { Transport, Producer, Consumer, Device } from "mediasoup-client/lib/types";

type TransportContextType = {
  sendTransportRef: React.MutableRefObject<Transport | null>;
  recvTransportRef: React.MutableRefObject<Transport | null>;
  audioProducerRef: React.MutableRefObject<Producer | null>;
  videoProducerRef: React.MutableRefObject<Producer | null>;
  consumersRef: React.MutableRefObject<Map<string, Consumer>>;
  activePeerOperations: React.MutableRefObject<Set<string>>;
  deviceRef: React.MutableRefObject<Device | null>;
};

const TransportContext = createContext<TransportContextType | undefined>(undefined);

export const TransportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const audioProducerRef = useRef<Producer | null>(null);
  const videoProducerRef = useRef<Producer | null>(null);
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const activePeerOperations = useRef<Set<string>>(new Set());
  const deviceRef = useRef<Device | null>(null);

  return (
    <TransportContext.Provider
      value={{
        sendTransportRef,
        recvTransportRef,
        audioProducerRef,
        videoProducerRef,
        consumersRef,
        activePeerOperations,
        deviceRef,
      }}
    >
      {children}
    </TransportContext.Provider>
  );
};

export const useTransportContext = () => {
  const context = useContext(TransportContext);
  if (!context) throw new Error("useTransportContext must be used within a TransportProvider");
  return context;
};
