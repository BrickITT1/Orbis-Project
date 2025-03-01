import React, { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import '../styles/pages/terms.scss'


export const ArticleNavigator = () => {
    const navigator = useNavigate()
    const locate = useLocation()

    return (
        <div className="any-article">
            <div className="any-atricle-title">
                Другие статьи
            </div>
            <nav>
                <ul className="article-items">
                    <li className={locate.pathname == '/terms' ? "article-item article-active" : "article-item"} onClick={()=>navigator('/terms')} >
                        Условия использования
                    </li>
                    <li className={locate.pathname == '/privacy' ? "article-item article-active" : "article-item"} onClick={()=>navigator('/privacy')}>
                        Политика конфиденциальности
                    </li>
                    <li className={locate.pathname == '/safety' ? "article-item article-active" : "article-item"} onClick={()=>navigator('/safety')}>
                        Политика безопасности
                    </li>
                    <li className={locate.pathname == '/licesce' ? "article-item article-active" : "article-item"} onClick={()=>navigator('/licesce')}>
                        Лицензионное соглашение
                    </li>
                    
            </ul>
            </nav>
        </div>
    )
}