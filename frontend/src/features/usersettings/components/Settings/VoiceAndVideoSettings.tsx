import { useDeviceContext } from "@/contexts/DeviceContext";
import React from "react";

const VoiceAndVideoSettings: React.FC = () => {

    const {
        allDevices, 
        selectedVideoInput, 
        selectedAudioInput,
        selectedAudioOutput, 
        setSelectedAudioInput, 
        setSelectedVideoInput, 
        setSelectedAudioOutput
    } = useDeviceContext();
    
    const onAudioInputChange = (deviceId: string) => {
    setSelectedAudioInput(deviceId);
    };

    const onVideoInputChange = (deviceId: string) => {
        setSelectedVideoInput(deviceId);
    };

    const onVideoAudioOutpuchange = (deviceId: string) => {
        setSelectedAudioOutput(deviceId);
    };
    return (
        <div className="flex flex-col gap-5">
            <h4>Voice Input</h4>
            <div className="">
            {allDevices.filter(d => d.kind === 'audioinput').map(val => (
                <div 
                    key={val.deviceId}
                    onClick={() => onAudioInputChange(val.deviceId)}
                    style={{ backgroundColor: val.deviceId === selectedAudioInput ? '#ffeabf' : 'transparent', cursor: 'pointer' }}
                >
                    {val.label}
                </div>
            ))}
            </div>
            <h4>Video Input</h4>
            <div className="">
            {allDevices.filter(d => d.kind === 'videoinput').map(val => (
                <div 
                    key={val.deviceId}
                    onClick={() => onVideoInputChange(val.deviceId)}
                    style={{ backgroundColor: val.deviceId === selectedVideoInput ? '#ffeabf' : 'transparent', cursor: 'pointer' }}
                >
                    {val.label}
                </div>
                ))}
            </div>
            <h4>Audio Output</h4>
            {typeof HTMLMediaElement.prototype.setSinkId === 'function' ? 'no': 'yes'}
            <div className="">
            {allDevices.filter(d => d.kind === 'audiooutput').map(val => (
                <div 
                    key={val.deviceId}
                    onClick={()=> onVideoAudioOutpuchange(val.deviceId)}
                    style={{ backgroundColor: val.deviceId === selectedAudioOutput ? '#ffeabf' : 'transparent', cursor: 'pointer' }}
                >
                    {val.label}
                </div>
            ))}
            </div>
        </div>
    );
};

export default VoiceAndVideoSettings;
