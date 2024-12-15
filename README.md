#Сборник утилит
Кравец М.А., 2021-2022 г.

graphql
    querytosql - генератор запроса из grahql в sql
        getSqlFields - возвращает string в виде параметров для запроса sql
        getWhere - возвращает string в виде where для бд WHERE ....
        getPaging - возвращает string в виде запроса страниц OFFSET ... LIMIT
        getOrder - возвращает string в виде запроса ORDER BY ...
        getResult - преобразует результат sql в результат graphql (JSON)
    scalartypes - расширение стандартных типов
objects
    flattenObject - "схлопывает" все вложенные поля объекта в один плоский объект

ПРИ ОБНОВЛЕНИИ БИБЛИОТЕКИ
В ЗАВИСИМЫХ ПРОЕКТАХ:
WINDOWS
1 Удалить папку в node_modules
2 npm install --no-package-lock --no-save axi-utils
LINUX (или в bash)
sudo rm -rf node_module/axi-utils && npm install --no-package-lock --no-save axi-utils