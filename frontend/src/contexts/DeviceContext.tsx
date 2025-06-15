import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Device } from 'mediasoup-client';

type DeviceContextType = {
  device: Device | null;
  initDevice: (routerRtpCapabilities: any) => Promise<void>;
  isReady: boolean;
};

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const useDeviceContext = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDeviceContext must be used within DeviceProvider');
  }
  return context;
};

export const DeviceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [isReady, setIsReady] = useState(false);

  const initDevice = useCallback(async (routerRtpCapabilities: any) => {
    if (!device) {
      const newDevice = new Device();
      await newDevice.load({ routerRtpCapabilities });
      setDevice(newDevice);
      setIsReady(true);
    }
  }, [device]);

  const value: DeviceContextType = {
    device,
    initDevice,
    isReady,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
};
