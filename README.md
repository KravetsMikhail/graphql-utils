# Сборник утилит

Кравец М.А., 2021-2023 г.

![GraphQL](https://img.shields.io/badge/-GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white) ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white) ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
## graphql

- **querytosql** - генератор запроса из grahql в sql
- **getSqlFields** - возвращает string в виде параметров для запроса sql
- **getWhere** - возвращает string в виде where для бд WHERE ....
- **getPaging** - возвращает string в виде запроса страниц OFFSET ... LIMIT
- **getOrder** - возвращает string в виде запроса ORDER BY ...
- **getResult** - преобразует результат sql в результат graphql (JSON)
- **scalartypes** - расширение стандартных типов

## objects

- **flattenObject** - "схлопывает" все вложенные поля объекта в один плоский объект

## ПРИ ОБНОВЛЕНИИ БИБЛИОТЕКИ

В ЗАВИСИМЫХ ПРОЕКТАХ:

WINDOWS

1 Удалить папку в node_modules

2 В командной строке:

```bash 
npm install --no-package-lock --no-save graphql-utils
```

LINUX (или в bash)

```bash
sudo rm -rf node_module/graphql-utils && npm install --no-package-lock --no-save graphql-utils
```
