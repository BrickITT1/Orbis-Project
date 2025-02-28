import React from 'react';

import "../styles/components/LoginForm.scss"
import CustomScroll from '../components/CustomScroll';

export const HomePage = () =>  {    

    return ( 
        <>
            <div className="block">
                <div className="main-home">
                    <div className="main-home__bg">
                        <div className="flex-col main-home__desc">
                            <h1 className='main-title'>Чат группы, где всегда весело</h1>
                            <p className="main-description">
                                Orbis — отличное место, чтобы встретиться с друзьями или создать глобальное сообщество. Организуйте собственное пространство для бесед, игр и хобби
                            </p>
                        </div>
                        <div className="main-home__img"></div>
                    </div>
                    <div className="flex-row main-home__buttons">
                        <div className="main-home__button-container">
                            <button>Загрузить</button>
                        </div>
                        <div className="main-home__button-container">
                            <button>Открыть в бразуере</button>
                        </div>
                    </div>
                </div>
            </div>
            {/* <div className="definition">
                <div className="definition-background"></div>
            </div> */}
            <div className="block">
                Демонстрация продукта,(общение)
            </div>
            {/* <div className="definition">
                <div className="definition-background"></div>
            </div> */}
            <div className="block">
                (хорошее качество звука)
            </div>
        </> 
    );
}