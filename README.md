# <img src="README/favicon.png" alt="" width="32px" /> Capibar JS

CapibarJS - это фреймворк для создания различных сервисов на основе `Node.js >= 18`,

### Принципы:
- `DDD`
- `transport-protocol-agnostic`
- `GRASP`
- `Low Coupling`
- `High Cohesion`

Он также предоставляет свою систему модульности, которая обеспечивает Низкую связанность `Low Coupling` и Высокое зацепление `High Cohesion`.



---

### Demo: http://chotko-reklama.ru:5500
### Example: https://github.com/CapibarJS/example

---

## Install

```shell
npm install @capibar/core
# or yarn
yarn add @capibar/core
```

> Node.js версия должна выше 18.x

## Usage

Сначала импортируйте `Server` из `@capibar/core` и создайте экземпляр сервера:

```js
const { Server } = require('@capibar/core');
const server = new Server();
server.start();
```
> По умолчанию запускаются Статический сервер из папки `app/static` и транспортные слои `http` и `ws`

Затем создайте файл `list.js` по пути `app/ship/list.js` и добавьте следующее содержимое:
```js
defineApi({
    params: ['name:string', 'speed:!int', 'description:?string'],
    returns: ['id'],
    method: async ({name, speed, description}) => {
        const id = Math.floor(Math.random() * 99)
        const newObj = {id, name, speed, description}
        newObj.description = newObj?.description ?? 'New description'
        return newObj;
    }
})
```

> ***defineApi*** - Удобная обертка для описания файл-функции.
> 
> ***params***    - Входные параметры функции, которые валидируются и трансформируются с помощью класса Schema. `string[] | ISchemaDefine`
> 
> ***returns***   - Выходные данные из функции. `string[] | ISchemaDefine`
> 
> ***method***    - Бизнес-логика функции `api.ship.add(...)`. `(...args) => Promise<any> | any`

### Пример вызова

> Пример вызова функции из другой функции `api.ship.add({ name: 'first ship', speed: 11 })`.

Каждая такая функция является контроллером транспортов.

Например, функцию `ship.add` можно получить по транспорту HTTP, выполнив запрос: 
`POST http://localhost:3000/api/ship/add` 
> body:`{ "name": "ship", "method": "add", args: [{ name:'ship', speed:11 }] }` 

или по транспорту WebSockets:

> `{ "name": "ship", "method": "add", "args": [{"name": 123,"speed": 1}] }`


### Получение структуры API

Для получения структуры API можно вызвать ручку с параметрами:

```json 
{
  "name": "_",
  "method": "introspect",
  "args": {}
}
```


---

# Лицензия
MIT. Подробнее см. в файле LICENSE.
