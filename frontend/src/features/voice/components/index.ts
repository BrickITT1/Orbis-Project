import AudioElement from "./Audio/AudioElement";
import AudioManager from "./Audio/AudioManager";
import { VoiceManager } from "./Audio/VoiceManager";
import { RemoteVideo } from "./Video/RemoteVideo";
import { VideoManager } from "./Video/VideoManager";
import { VoiceMember } from "./VoiceMember";
import { VoiceMemberManager } from "./VoiceMemberManager";
import { VoiceRoomChat } from "./VoiceRoomChat";

const VoiceComponets = {
    AudioElement, 
    AudioManager, 
    VoiceManager, 
    RemoteVideo, 
    VideoManager,
    VoiceMember,
    VoiceMemberManager,
    VoiceRoomChat
}

export default VoiceComponets;