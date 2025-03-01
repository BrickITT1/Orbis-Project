import React from 'react';
import { ArticleNavigator } from '../../components/ArticleNavigator';
import Article from '../../components/Layouts/Article';

const title = "Условия использования Orbis";
const description = "Добро пожаловать в Orbis! Orbis — это онлайн-платформа, где вы можете общаться, отдыхать и проводить время в кругу друзей.";

const content = `
#Добро пожаловать в Orbis! Orbis — это онлайн-платформа, где вы можете общаться, отдыхать и проводить время в кругу друзей. Мы рады, что вы решили присоединиться к нашему Сообществу.
## 1. Термины, используемые в настоящих Правилах
1.1. Платформа Orbis (или Платформа) – площадка, известная под именем «Orbis», размещённая на сайте в сети Интернет по адресу: aaaaaaaaaaaa (включая все уровни указанных доменов, как функционирующие на дату принятия Пользователем настоящих Правил, так и запускаемые и вводимые в эксплуатацию в течение всего срока его действия) и доступная Пользователю через сайт, мобильную версию Платформы, приложения и иные ресурсы, представляющая собой результат интеллектуальной деятельности в форме программы для ЭВМ. Платформа представлена в объективной форме совокупностью данных и команд, и порождаемых аудиовизуальных отображений (включая входящие в её состав графические изображения и пользовательский интерфейс), (далее – данные и команды), предназначенных для функционирования ЭВМ и мобильных устройств в целях получения определённого результата в виде организации функциональности социальной сети. Совокупность данных и команд состоит из активированных и неактивированных данных и команд.
1.2. Неактивированные данные и команды – данные, команды и порождаемые аудиовизуальные отображения, позволяющие увеличить количество виртуальных ценностей, используемых в рамках функциональных возможностей Платформы. Условия предоставления Администрацией Пользователю права на использование неактивированных данных и команд определены в лицензионном соглашении, являющемся неотъемлемой частью настоящих Правил, действующая редакция которого располагается в свободном доступе в сети Интернет по адресу: licence, заключаемом Администрацией Платформы с Пользователем.

## 2. Статус Правил пользования Платформой Orbis
2.1. Настоящие Правила пользования Платформой Orbis (ранее и далее – Правила) разработаны командой разработчиков Orbis и определяют условия использования и развития Платформы, ее сервисов, а также права и обязанности его Пользователей и Администрации. Правила распространяются также на отношения, связанные с правами и интересами третьих лиц, не являющимися Пользователями Платформы, но чьи права и интересы могут быть затронуты в результате действий Пользователей Платформы.
### 2.2. Настоящие Правила являются юридически обязательным соглашением
Настоящие Правила являются юридически обязательным соглашением между Пользователем и Администрацией Платформы, предметом которого является предоставление Администрацией Платформы Пользователю доступа к использованию Платформы и его функциональности.
#### 2.2.1. Пользователь обязан полностью ознакомиться с настоящими Правилами
Пользователь обязан полностью ознакомиться с настоящими Правилами до момента регистрации на Платформе.
#### 2.2.2. Регистрация Пользователя на Платформе
Регистрация Пользователя на Платформе означает полное и безоговорочное принятие Пользователем настоящих Правил в соответствии со ст. 438 Гражданского кодекса Российской Федерации.
`;

export const LicescePage: React.FC = () =>  {

    
    
    return (
        <div className='Terms'>
            <ArticleNavigator />
            <Article title={title} description={description} content={content} />
        </div>
    );
}