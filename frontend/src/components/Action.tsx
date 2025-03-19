import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../app/hooks';
import useChatSocket from '../app/useChatSocket';
interface Message {
  id: number,
  content: string,
  user_id: number,
  is_edited: boolean,
  timestamp: string,
}

function scrollToBottom() {
  const messagesDiv = document.querySelector('.messages');
  if (messagesDiv) {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
  
}

const groupMessagesByMinuteAndUserId = (messages: Message[]): { messages: Message[]; user_id: number; minute: string }[] => {
  const groupedMessages: { user_id: number; messages: Message[]; minute: string }[] = [];
  let currentGroup: { user_id: number; messages: Message[]; minute: string } | null = null;

  messages.forEach(message => {
    const minuteKey = message.timestamp.substring(0, 5); // Получаем 'HH:mm'

    // Если текущая группа пуста, или пользователь изменился, или минута изменилась, создаем новую группу
    if (!currentGroup || currentGroup.user_id !== message.user_id || currentGroup.minute !== minuteKey) {
      currentGroup = { user_id: message.user_id, messages: [], minute: minuteKey };
      groupedMessages.push(currentGroup);
    }

    // Добавляем сообщение в текущую группу
    currentGroup.messages.push(message);
  });

  // Возвращаем массив объектов с сообщениями, user_id и минутой
  return groupedMessages.map(group => {
    return {
      messages: group.messages,
      user_id: group.user_id,
      minute: group.minute // Используем минуту из группы
    };
  });
};

export const Action: React.FC = () =>  {
    const activeChat = useAppSelector(state => state.chat.activeChat);
    const token = useAppSelector(state => state.auth.user?.token)
    const [newmessage, setNewMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [groupedMessagess, setgroupedMessagess] = useState<any>();
    const socket = useChatSocket();

    useEffect(() => {
        if (socket) {
            socket.emit('join-room', activeChat);
        }
        
    }, [activeChat, ]);

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
  
    useEffect(()=> {
      scrollToBottom();
      if (messages) {
        const groupedMessages = groupMessagesByMinuteAndUserId(messages);
        setgroupedMessagess(groupedMessages);
        console.log(groupedMessages)
      }
      
    }, [messages])

    const sendMessage = () => {

        if (newmessage.trim() && activeChat && socket) {
          socket.emit('send-message', {
            room: activeChat,
            user_id: token,
            text: newmessage,
          });
          setNewMessage('');
        } else {
          //alert('Выберите комнату и введите сообщение!');
        }
      };
      useEffect(() => {
        if (socket) {
          socket.on('new-message', (message: Message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
          });
          socket.on('message-history', (history: Message[]) => {
            setMessages(history);
          });
        //   socket.on('message-history', (history: Message[]) => {
        //     setMessages(history);
        //   });
    
        //   socket.on('user-left', ({ user, room }: { user: string; room: string }) => {
        //     setMessages((prevMessages) => [
        //       ...prevMessages,
        //       {
        //         id: Date.now(),
        //         text: `Пользователь ${user} покинул комнату.`,
        //         user: 'Система',
        //         timestamp: new Date().toLocaleTimeString(),
        //       },
        //     ]);
        //   });
    
          socket.on('error', (error: string) => {
            alert(error);
          });
    
          return () => {
            socket.off('new-message');
            socket.off('message-history');
          };
        }
      }, [socket]);
    if (groupedMessagess) {
      console.log(groupedMessagess)
    }
    return ( 
        <>
            <div className="actions">
                <div className="actions-main">
                    
                    <div className="chat-title">
                      <div className="title">
                        
                      {activeChat}
                      </div>
                      <div className="buttons">
                        <div className="voice">
                        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M28.7478 20.6679L26.0691 17.9892C25.2706 17.197 24.1928 16.7505 23.068 16.7457C21.9433 16.7409 20.8617 17.1783 20.0565 17.9636C19.6269 18.3957 19.06 18.6646 18.4536 18.7239C17.8471 18.7832 17.2389 18.6293 16.7336 18.2887C14.7394 16.9578 13.0262 15.2479 11.6915 13.2562C11.3569 12.7453 11.2085 12.1347 11.2715 11.5272C11.3345 10.9197 11.605 10.3525 12.0373 9.92117C12.8155 9.11518 13.2472 8.03661 13.2402 6.91629C13.2331 5.79597 12.7878 4.72291 11.9996 3.9268L9.3208 1.24802C8.51881 0.448778 7.43274 0 6.30051 0C5.16827 0 4.0822 0.448778 3.28021 1.24802L2.50946 2.01999C-1.50867 6.03816 -1.20792 14.486 7.15223 22.8414C12.1932 27.8836 17.267 29.9949 21.3813 29.9949C22.5924 30.0353 23.7994 29.8341 24.932 29.4033C26.0647 28.9725 27.1002 28.3205 27.9783 27.4854L28.7503 26.7134C29.551 25.9111 30.0005 24.8237 30 23.6902C29.9995 22.5566 29.5492 21.4696 28.7478 20.6679ZM27.0261 24.9917L26.2542 25.7637C23.0884 28.9295 16.1005 28.3511 8.8715 21.1209C1.64252 13.8906 1.06294 6.8978 4.22873 3.73197L4.99461 2.96122C5.33945 2.61762 5.80641 2.4247 6.2932 2.4247C6.77999 2.4247 7.24695 2.61762 7.59179 2.96122L10.2705 5.63999C10.6091 5.98027 10.8013 6.43939 10.8061 6.91939C10.8108 7.39938 10.6278 7.86224 10.2961 8.20918C9.47334 9.03721 8.96011 10.1228 8.8424 11.2842C8.72469 12.4455 9.00966 13.6121 9.64956 14.5883C11.1662 16.8579 13.1164 18.8052 15.3882 20.3185C16.3615 20.9585 17.525 21.2451 18.6842 21.1305C19.8435 21.016 20.9283 20.5071 21.7575 19.689C22.1038 19.3533 22.568 19.1669 23.0502 19.1699C23.5325 19.1728 23.9943 19.3649 24.3364 19.7048L27.0152 22.3836C27.1878 22.5537 27.3251 22.7563 27.4192 22.9797C27.5132 23.2032 27.5621 23.443 27.5632 23.6854C27.5642 23.9278 27.5173 24.168 27.4251 24.3922C27.3329 24.6164 27.1973 24.8201 27.0261 24.9917Z" fill="white"/>
                          </svg>

                        </div>
                      </div>
                    </div>
                    <div className="messages">
                      
                      {groupedMessagess && groupedMessagess.map((value: any, index: number ) => (
                        <>
                        { value.length == 1 ?
                          value.map((val: any, idx: number) => (
                            <div key={idx}>
                            
                            <div className="avatar">
                              <img src="/img/icon.png" alt="" width={"50px"} height={"50px"}/>
                            </div>
                            <div className="content">
                              {/* <h3>{val.user_id}</h3> */}
                              <h3>{val.user_id}</h3>
                              <div className="text">
                                {val.content}
                              </div>
                              <div className="time">
                                {val.timestamp.slice(0,5)}
                              </div>
                            </div>
                            
                          </div>
                           
                          )) : <> 
                          <div key={index} className='group'>
                            <div className="avatar">
                              <img src="/img/icon.png" alt="" width={"50px"} height={"50px"}/>
                            </div>
                            <h3>{value.user_id}</h3>
                            <div className="mess">
                              {value.messages.map((val: any, idx: number) => (
                                  
                                  <>
                                    
                                    <div className="content">
                                      {/* <h3>{val.user_id}</h3> */}
                                      
                                      <div className="text">
                                        {val.content}
                                      </div>
                                      <div className="time">
                                        {val.timestamp.slice(0,5)}
                                      </div>
                                      
                                    </div>
                                  </>
                                
                              ))}
                              {/* <div className="time">
                                        {value[0].timestamp.slice(0,5)}
                                      </div> */}
                            </div>
                            
                          </div>
                          </>
                        }
                        </>
                      )
                        
                      )}
                    </div>
                    <div className="chat-input">
                      <input type="text" value={newmessage} onChange={(e)=> setNewMessage(e.target.value)}/>
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
        </> 
    );
}