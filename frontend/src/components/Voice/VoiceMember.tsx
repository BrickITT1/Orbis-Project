import React from "react";
import { PeerInfo } from '../../types/Channel';

type typeMember = 'chat' | 'server'

export const VoiceMember: React.FC<{roomPeers: PeerInfo[], typeMember: typeMember}> =({roomPeers, typeMember}) => {
    if (typeMember == 'chat') {
      console.log(roomPeers)
        return (
            <>
            {roomPeers.map(peer => (
                <li key={peer.id}>
                  <div className="voice-avatar">
                    <img
                      src="/img/icon.png"
                      alt={`Аватар ${peer.username}`}
                      width={150}
                      height={150}
                    />
                  </div>
                  <div className="voice-name">
                    {peer.username} {peer.muted ? '(muted)' : ''}
                  </div>
                </li>
              ))}
            </>
        )
    }
    if (typeMember == 'server') {
        return (
            <>
                {roomPeers.map(peer => (
                                <li key={peer.id}>
                                    <span><img src="/img/icon.png" alt="" width={"30px"} height={"30px"} /></span>
                                    {peer?.username}
                                    
                                </li>
                                
                        ))}
            </>
        )
    }

    return null
}