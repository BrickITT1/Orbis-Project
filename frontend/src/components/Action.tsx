import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../app/hooks';
import { SingleMessage } from './Message/SingleMessage';
import { MessageGroup } from './Message/MessageGroup';
import { useChatMessages } from '../app/useChatMessages';
import { useVoiceChat } from '../app/useVoiceChat';


function scrollToBottom() {
  const messagesDiv = document.querySelector('.messages');
  if (messagesDiv) {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
  
}

export const Action: React.FC = () =>  {

    const activeChat = useAppSelector(state => state.chat.activeChat);
    const token = useAppSelector(state => state.auth.user?.access_token);
    const MyUsername = useAppSelector(state => state.auth.user?.username);
    const {
      messages,
      groupedMessages,
      newMessage,
      setNewMessage,
      sendMessage,
      setEnable,
      setDisable,
      isSocketConnected,
    } = useChatMessages(String(activeChat?.id), token, MyUsername);
    
    const {
      joinRoom,
      leaveRoom,
      setEnableV,
      setDisableV,
      isVoiceSocketConnected,
      roomPeers,
      peers
    } = useVoiceChat();
    
    useEffect(()=> {
      if (activeChat && !isVoiceSocketConnected) {
        setEnableV();
      } else {
        setDisableV();
      }
      
    }, [activeChat])

    useEffect(()=> {
      if (activeChat && !isSocketConnected) {
        setEnable();
      } else {
        setDisable();
      }
      
    }, [activeChat])

    useEffect(() => {
      const searchField: HTMLInputElement | null = document.querySelector('.chat-input input');
      const searchButton: HTMLButtonElement | null = document.querySelector('.enter-message');
  
      const handleKeyPress = (e: KeyboardEvent) => {
          if (e.key === 'Enter' && searchButton) {
              searchButton.click();
              scrollToBottom();
          }
      };
  
      if (searchField) {
          searchField.addEventListener('keydown', handleKeyPress);
      }
  
      return () => {
          if (searchField) {
              searchField.removeEventListener('keydown', handleKeyPress);
          }
      };
    }, []);

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    
    return (
      activeChat ? (
        <div className="actions">
        <div className="actions-main">
          <div className="chat-title">
            <div className="title">{activeChat?.name || 'Чат'}</div>
            <div className="buttons">
              <div className="voice" onClick={joinRoom}>
                <svg width="31" height="30" viewBox="0 0 31 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.0425 7.79193C12.7779 6.90975 12.5916 5.99362 12.4917 5.05175C12.3935 4.126 11.5861 3.43762 10.6552 3.43762H6.33692C5.22648 3.43762 4.37105 4.39668 4.4688 5.50281C5.45342 16.6456 14.3295 25.5217 25.4723 26.5063C26.5784 26.6041 27.5375 25.7517 27.5375 24.6414V20.7917C27.5375 19.3862 26.849 18.5816 25.9234 18.4834C24.9815 18.3836 24.0654 18.1972 23.1832 17.9326C22.104 17.6089 20.9359 17.9136 20.1392 18.7102L18.2913 20.5581C14.9625 18.7566 12.2185 16.0126 10.417 12.6838L12.2649 10.8359C13.0615 10.0392 13.3662 8.871 13.0425 7.79193Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="voice-chat">
            <ul className='users'>
            
              {roomPeers.map(peer => (
                <li key={peer.id}>
                  <div className="voice-avatar">
                    <img 
                      src="/img/icon.png" 
                      alt={`Аватар пользователя ${peer?.username}`} 
                      width={150}
                      height={150}
                    />
                  </div>
                  <div className="voice-name">
                    {peer?.username}
                  </div>
                </li>
              ))}
            </ul>
            <div className="voice-buttons">
              <div className="voice-mute">
                <button>
                  <svg width="42" height="48" viewBox="0 0 42 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M41 24V26.5C41 37.5458 32.0458 46.5 21 46.5C9.9543 46.5 1 37.5458 1 26.5V24M21 36.5C15.4771 36.5 11 32.0227 11 26.5V11.5C11 5.97715 15.4771 1.5 21 1.5C26.5227 1.5 31 5.97715 31 11.5V26.5C31 32.0227 26.5227 36.5 21 36.5Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
              </button>
              {/* <button><svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M34 20V11.5001C34 5.97722 29.5228 1.50008 24 1.50008C21.6015 1.50008 19.4002 2.3445 17.6771 3.7523M4 24V26.5C4 37.5458 12.9543 46.5 24 46.5C30.1633 46.5 35.6752 43.7122 39.344 39.329M1.5 1.5L46.5 46.5M24 36.5C18.4771 36.5 14 32.023 14 26.5V14.0001L32.2037 32.22C30.3962 34.8075 27.3957 36.5 24 36.5Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg> </button>*/}

              </div>
              <div className="voice-leave" onClick={leaveRoom}>
              <button>
                <svg width="52" height="22" viewBox="0 0 52 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M26.001 1C46.9715 1.0013 50.2823 7.6485 50.7243 10.4505C50.8323 10.8648 52.5715 20.0957 45.7465 20.8117C28.766 22.5472 40.4397 10.792 25.9992 11.2385C11.5586 11.685 23.232 22.5473 6.25485 20.8125C-0.571774 20.095 1.16773 10.864 1.27583 10.4532C1.71635 7.6495 5.02895 1.0004 26.001 1Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              </div>
            </div>
          </div>
          <div className="messages">
            
          {groupedMessages?.map((group, index) => (
            group.messages.length === 1 ? (
              <SingleMessage 
                key={`single-${group.messages[0].id}`} 
                message={group.messages[0]} 
              />
            ) : (
              <MessageGroup 
                key={`group-${group.user_id}-${group.minute}`} 
                group={group} 
              />
            )
          ))}
        </div>
          
          <div className="chat-input">
            <input 
              type="text" 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Введите сообщение..."
            />
            <button>
              <svg width="52" height="40" viewBox="0 0 52 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="26" cy="20" r="18.5" stroke="#1C212C" strokeWidth="3"/>
                <path d="M19.8724 13.2856C20.6354 14.5604 20.4436 17.4835 19.5646 18.106C18.6857 18.7286 17.1447 17.0652 16.3816 15.7903C15.6186 14.5154 15.7125 12.9773 16.5915 12.3547C17.4705 11.7321 19.1093 12.0107 19.8724 13.2856Z" fill="#1C212C"/>
                <path d="M32.1276 13.2856C31.3646 14.5604 31.5564 17.4835 32.4354 18.106C33.3143 18.7286 34.8553 17.0652 35.6184 15.7903C36.3814 14.5154 36.2875 12.9773 35.4085 12.3547C34.5295 11.7321 32.8907 12.0107 32.1276 13.2856Z" fill="#1C212C"/>
                <path d="M33 25.9999C33 27.6567 29.866 30 26 30C22.134 30 19 27.6567 19 25.9999C19 24.343 22.134 27.5 26 27.5C29.866 27.5 33 24.343 33 25.9999Z" fill="#1C212C"/>
                <path d="M3.5 2.00022L2.65297 0.762259L2.65297 0.762259L3.5 2.00022ZM0.823451 2.56977C0.309579 3.21956 0.419762 4.1629 1.06955 4.67677C1.71934 5.19064 2.66268 5.08046 3.17655 4.43067L0.823451 2.56977ZM12.5 6.50022C13.6391 5.52425 13.6388 5.52398 13.6386 5.52368C13.6385 5.52355 13.6382 5.52322 13.638 5.52296C13.6375 5.52242 13.637 5.52179 13.6363 5.52105C13.6351 5.51957 13.6334 5.51769 13.6315 5.5154C13.6275 5.51084 13.6222 5.50467 13.6155 5.49696C13.6021 5.48155 13.5832 5.45997 13.5592 5.4327C13.511 5.37819 13.442 5.30085 13.3541 5.20458C13.1786 5.01222 12.9267 4.74316 12.6148 4.42874C11.995 3.80381 11.1203 2.98148 10.124 2.22401C9.14337 1.47849 7.96166 0.731231 6.73058 0.338255C5.48837 -0.0582709 3.98692 -0.150444 2.65297 0.762259L4.34703 3.23818C4.63463 3.0414 5.06896 2.95698 5.8183 3.19618C6.57875 3.43893 7.44435 3.95535 8.30835 4.6122C9.15662 5.2571 9.9239 5.97583 10.4848 6.54137C10.7633 6.82218 10.9865 7.0607 11.1384 7.22712C11.2143 7.31023 11.2721 7.37508 11.3099 7.4179C11.3288 7.43931 11.3427 7.45519 11.3513 7.46506C11.3556 7.47 11.3586 7.47344 11.3602 7.47531C11.361 7.47625 11.3614 7.4768 11.3616 7.47694C11.3616 7.47702 11.3616 7.47699 11.3615 7.47687C11.3615 7.47681 11.3613 7.47664 11.3613 7.4766C11.3611 7.47641 11.3609 7.47619 12.5 6.50022ZM2.65297 0.762259C2.16097 1.09889 1.68981 1.58199 1.38681 1.91322C1.22414 2.09106 1.08619 2.25165 0.988501 2.36824C0.939426 2.4268 0.899917 2.47497 0.871874 2.50951C0.857839 2.5268 0.846633 2.54073 0.838494 2.55089C0.834422 2.55598 0.831114 2.56012 0.828598 2.56329C0.82734 2.56487 0.82628 2.5662 0.825421 2.56729C0.824992 2.56783 0.824612 2.56831 0.824284 2.56872C0.82412 2.56893 0.823968 2.56912 0.823829 2.56929C0.82376 2.56938 0.823665 2.5695 0.823631 2.56955C0.823539 2.56966 0.823451 2.56977 2 3.50022C3.17655 4.43067 3.17647 4.43077 3.17639 4.43087C3.17637 4.4309 3.17629 4.43099 3.17625 4.43105C3.17616 4.43116 3.17608 4.43126 3.17601 4.43134C3.17588 4.43151 3.1758 4.43161 3.17577 4.43165C3.1757 4.43174 3.17582 4.43159 3.17613 4.4312C3.17674 4.43043 3.1781 4.42872 3.18018 4.42613C3.18433 4.42095 3.19133 4.41224 3.20095 4.40039C3.22022 4.37666 3.24982 4.34053 3.28796 4.29502C3.36468 4.20345 3.47354 4.07676 3.60041 3.93807C3.87649 3.63625 4.15532 3.36935 4.34703 3.23818L2.65297 0.762259Z" fill="#1C212C"/>
                <path d="M49 2.44944L49.847 1.21148L49.847 1.21148L49 2.44944ZM51.6765 3.01899C52.1904 3.66878 52.0802 4.61212 51.4304 5.12599C50.7807 5.63986 49.8373 5.52968 49.3235 4.87989L51.6765 3.01899ZM40 6.94944C38.8609 5.97347 38.8612 5.9732 38.8614 5.9729C38.8615 5.97277 38.8618 5.97244 38.862 5.97218C38.8625 5.97164 38.863 5.97101 38.8637 5.97027C38.8649 5.96879 38.8666 5.96691 38.8685 5.96462C38.8725 5.96006 38.8778 5.95389 38.8845 5.94618C38.8979 5.93077 38.9168 5.90919 38.9408 5.88192C38.989 5.82741 39.058 5.75007 39.1459 5.6538C39.3214 5.46144 39.5733 5.19238 39.8852 4.87796C40.505 4.25303 41.3797 3.4307 42.376 2.67323C43.3566 1.92771 44.5383 1.18045 45.7694 0.787473C47.0116 0.390948 48.5131 0.298775 49.847 1.21148L48.153 3.6874C47.8654 3.49062 47.431 3.4062 46.6817 3.6454C45.9213 3.88814 45.0556 4.40457 44.1917 5.06142C43.3434 5.70632 42.5761 6.42505 42.0152 6.99058C41.7367 7.2714 41.5135 7.50992 41.3616 7.67634C41.2857 7.75945 41.2279 7.8243 41.1901 7.86712C41.1712 7.88853 41.1573 7.9044 41.1487 7.91428C41.1444 7.91922 41.1414 7.92266 41.1398 7.92453C41.139 7.92547 41.1386 7.92601 41.1384 7.92616C41.1384 7.92624 41.1384 7.92621 41.1385 7.92609C41.1385 7.92602 41.1387 7.92585 41.1387 7.92582C41.1389 7.92563 41.1391 7.92541 40 6.94944ZM49.847 1.21148C50.339 1.54811 50.8102 2.0312 51.1132 2.36244C51.2759 2.54028 51.4138 2.70087 51.5115 2.81745C51.5606 2.87602 51.6001 2.92419 51.6281 2.95873C51.6422 2.97602 51.6534 2.98995 51.6615 3.00011C51.6656 3.0052 51.6689 3.00934 51.6714 3.0125C51.6727 3.01409 51.6737 3.01542 51.6746 3.0165C51.675 3.01705 51.6754 3.01752 51.6757 3.01794C51.6759 3.01815 51.676 3.01834 51.6762 3.01851C51.6762 3.0186 51.6763 3.01872 51.6764 3.01876C51.6765 3.01888 51.6765 3.01899 50.5 3.94944C49.3235 4.87989 49.3235 4.87999 49.3236 4.88009C49.3236 4.88012 49.3237 4.88021 49.3238 4.88027C49.3238 4.88038 49.3239 4.88048 49.324 4.88056C49.3241 4.88073 49.3242 4.88083 49.3242 4.88087C49.3243 4.88096 49.3242 4.88081 49.3239 4.88042C49.3233 4.87965 49.3219 4.87794 49.3198 4.87535C49.3157 4.87017 49.3087 4.86146 49.2991 4.84961C49.2798 4.82588 49.2502 4.78975 49.212 4.74424C49.1353 4.65267 49.0265 4.52597 48.8996 4.38729C48.6235 4.08547 48.3447 3.81857 48.153 3.6874L49.847 1.21148Z" fill="#1C212C"/>
              </svg>
            </button>
            <button onClick={sendMessage} className='enter-message'>
              <svg width="55" height="33" viewBox="0 0 52 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.9408 2.14745L34.6459 18L2.9407 33.8526C2.50493 34.0705 2.04665 33.6 2.27591 33.1701L9.48824 19.6468C10.0373 18.6174 10.0372 17.3821 9.48823 16.3527L2.27601 2.82996C2.04674 2.40007 2.50504 1.92957 2.9408 2.14745Z" stroke="#1C212C" strokeWidth="3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    ) : (<div className="actions"> </div>)

  )

}