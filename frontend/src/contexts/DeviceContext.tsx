import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import { Device } from 'mediasoup-client';

type DeviceContextType = {
  device: Device | null;
  initDevice: (routerRtpCapabilities: any) => Promise<void>;
  isReady: boolean;

  selectedVideoInput: string | null;
  selectedAudioInput: string | null;
  selectedAudioOutput: string | null;

  setSelectedVideoInput: (deviceId: string) => void;
  setSelectedAudioInput: (deviceId: string) => void;
  setSelectedAudioOutput: (deviceId: string) => void;

  allDevices: MediaDeviceInfo[];
};

const LOCAL_STORAGE_KEYS = {
  videoInput: 'selectedVideoInput',
  audioInput: 'selectedAudioInput',
  audioOutput: 'selectedAudioOutput',
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
  const [allDevices, setAllDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioOutput, setSelectedAudioOutputState] = useState<string | null>(
    localStorage.getItem(LOCAL_STORAGE_KEYS.audioOutput)
  )

  const [selectedAudioInput, setSelectedAudioInputState] = useState<string | null>(
    localStorage.getItem(LOCAL_STORAGE_KEYS.audioInput)
  );
  const [selectedVideoInput, setSelectedVideoInputState] = useState<string | null>(
    localStorage.getItem(LOCAL_STORAGE_KEYS.videoInput)
  );

  const setSelectedAudioOutput = (id: string) => {
    setSelectedAudioOutputState(id);
    localStorage.setItem(LOCAL_STORAGE_KEYS.audioOutput, id);
  }

  const setSelectedAudioInput = (id: string) => {
    setSelectedAudioInputState(id);
    localStorage.setItem(LOCAL_STORAGE_KEYS.audioInput, id);
  };

  const setSelectedVideoInput = (id: string) => {
    setSelectedVideoInputState(id);
    localStorage.setItem(LOCAL_STORAGE_KEYS.videoInput, id);
  };

  const initDevice = useCallback(async (routerRtpCapabilities: any) => {
    if (!device) {
      const newDevice = new Device();
      await newDevice.load({ routerRtpCapabilities });
      setDevice(newDevice);
      setIsReady(true);
    }
  }, [device]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAllDevices(devices);

        const availableAudioInputs = devices.filter(d => d.kind === 'audioinput');
        const availableVideoInputs = devices.filter(d => d.kind === 'videoinput');
        const availableAudioOutputs = devices.filter(d => d.kind === 'audiooutput');

        const savedAudioId = localStorage.getItem(LOCAL_STORAGE_KEYS.audioInput);
        const savedVideoId = localStorage.getItem(LOCAL_STORAGE_KEYS.videoInput);
        const savedAudioOutputId = localStorage.getItem(LOCAL_STORAGE_KEYS.audioOutput);
       

        if (savedAudioId && availableAudioInputs.some(d => d.deviceId === savedAudioId)) {
          setSelectedAudioInput(savedAudioId);
        } else if (availableAudioInputs.length) {
          setSelectedAudioInput(availableAudioInputs[0].deviceId);
        }

        if (savedAudioOutputId && availableAudioOutputs.some(d => d.deviceId === savedAudioId)) {
          setSelectedAudioInput(savedAudioOutputId);
        } else if (availableAudioOutputs.length) {
          setSelectedAudioInput(availableAudioOutputs[0].deviceId);
        }

        if (savedVideoId && availableVideoInputs.some(d => d.deviceId === savedVideoId)) {
          setSelectedVideoInput(savedVideoId);
        } else if (availableVideoInputs.length) {
          setSelectedVideoInput(availableVideoInputs[0].deviceId);
        }
      } catch (err) {
        console.error('Permission error or no devices found:', err);
      }
    };

    fetchDevices();
  }, []);

  useEffect(() => {
    console.log('Devices:', allDevices);
    console.log('Saved audio input ID:', localStorage.getItem(LOCAL_STORAGE_KEYS.audioInput));
  }, [allDevices]);

  const value: DeviceContextType = {
    device,
    initDevice,
    isReady,
    selectedVideoInput,
    selectedAudioInput,
    selectedAudioOutput,
    setSelectedVideoInput,
    setSelectedAudioInput,
    setSelectedAudioOutput,
    allDevices,
    
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
};
