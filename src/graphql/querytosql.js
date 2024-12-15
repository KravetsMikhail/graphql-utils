const { conformsTo } = require('lodash')
const _ = require('lodash')

function getCondition(type, field) {
    let _fieldCondition = ''
    let _coma = ''
    let _lastValue = null
    _.forOwn(field, (value, key) => {
        _field = key.split('_')
        if(_field && _field.length > 1) {
            switch(_field[1]){
                case 'gt':
                    _coma = ''
                    if(!_.isInteger(value)) _coma = "'" 
                    _fieldCondition = '"' + type + '"."' + _field[0] + '">' + _coma + value + _coma
                    break
                case 'lt':
                    _coma = ''
                    if(!_.isInteger(value)) _coma = "'" 
                    _fieldCondition = '"' + type + '"."' + _field[0] + '"<' + _coma + value + _coma
                    break
                case 'in':
                    _fieldCondition += '"' + type + '"."' + _field[0] + '" IN ('
                    _.take(value, value.length-1).map(a => _.isInteger(a) || _.isNumber(a) ? _fieldCondition += a + ', ' 
                                                        : _fieldCondition += "'" + a + "', ")
                    _lastValue = _.last(value)
                    _fieldCondition += _.isInteger(_lastValue) || _.isNumber(_lastValue) ? _lastValue  + ")"
                                            : "'" + _lastValue + "')"
                    break
                case 'notin':
                    _fieldCondition += '"' + type + '"."' + _field[0] + '" NOT IN ('
                    _.take(value, value.length-1).map(a => _.isInteger(a) || _.isNumber(a) ? _fieldCondition += a + ', ' 
                                                        : _fieldCondition += "'" + a + "', ")
                    _lastValue = _.last(value)
                    _fieldCondition += _.isInteger(_lastValue) || _.isNumber(_lastValue) ? _lastValue  + ")"
                                            : "'" + _lastValue + "')"
                    break
                case 'treeUp':
                    _fieldCondition = '"' + type + '"."' + _field[0] + '" @> ' + "'" + value + "'"
                    break
                case 'treeDown':
                    _fieldCondition = '"' + type + '"."' + _field[0] + '" <@ ' + "'" + value + "'"
                    break
                case 'treeMatch':
                    _fieldCondition = '"' + type + '"."' + _field[0] + '" ~ ' + "'" + value + "'"
                    break
                case 'treeNlevel':
                    _fieldCondition = 'nlevel("' + type + '"."' + _field[0] + '")=' + value
                    break
            }
        } else if(key === 'search'){
            const _v = value ? value.toLowerCase().trim().replace(/\n|<.*?>/g,'').replace(/&nbsp;/g, ' ') : ''
            _fieldCondition = '"' + type + '"."' + key + '" LIKE ' + "'%" + _v + "%'"
        } else {
            const _v = _.isInteger(value) ? value : "'" + value + "'"
            _fieldCondition = '"' + type + '"."' + key + '"=' + _v
        }
    })
    return _fieldCondition
}

function getSqlFieldsFunc(schema, mainType, fields){
    if(!fields || fields.length === 0) return null
        let _subObjects = []
        let _startFields = ''
        let _endFileds = ''

        //ВАРИАНТ С JSON
        //Набираем обычные поля и отдельно внутренние объекты
        let _fields = fields.map(z => {
            if(z.includes('.')){
                let _ff = z.split('.')
                //убираем все что ниже 2-го уровня вложенности
                if(_ff.length > 2 || z.includes("totalRows")) return null
                
                let _tt = ''
                let _ft = schema._typeMap[mainType]._fields[_ff[0]].type.constructor.name //наименование типа поле, например GraphQLList - массив
                switch(_ft){
                    case 'GraphQLObjectType':
                        _tt = schema._typeMap[mainType]._fields[_ff[0]].type.name //наименование типа = таблица в БД
                    break
                    case 'GraphQLList':
                        if(schema._typeMap[mainType]._fields[_ff[0]].type.ofType.ofType){
                            _tt = schema._typeMap[mainType]._fields[_ff[0]].type.ofType.ofType.name //наименование типа = таблица в БД
                        } else {
                            _tt = schema._typeMap[mainType]._fields[_ff[0]].type.ofType.name
                        }
                    break
                }

                if(!_.find(_subObjects, ['field',_ff[0]])){   
                    _subObjects.push( {field: _ff[0], type: _tt, fieldType: _ft} )
                }

                return null
            } else {
                if(z === 'totalRows' || z === '__typename') return null
                return "'" + z + "'," + '"' + mainType + '"."' + z + '"'                
            }
        })    

        _.remove(_fields, function(n) {
            return n === null
        })  

        //Добавляем totalRow
        if(_fields && _fields.length > 0) {
            _fields.push("'totalRows', COUNT(*) OVER()")
            _startFields = 'jsonb_build_object('
            _endFileds = ')'
        }
        
        _.map(_subObjects, (v) => {
            //вытаскиваем поля нашего подтипа
            let _vfields = fields.filter(f=>f.includes(v.field))
            if(_vfields && _vfields.length > 0) {
                //DISTINCT работает только с jsonb_ (не json_)
                //Без DISTINCT выдает дубляжи, столько сколько join в запросе
                let _started = "', json_agg(DISTINCT jsonb_build_object("
                //ВНИМАНИЕ! Тут жетско вшит orderBy!!! Надо вынимать из grqphql!!!
                //let _finalized = ") ORDER BY " + '"' +  v.type + '"."createdAt" DESC)'
                let _finalized = "))"

                if(v.fieldType !== 'GraphQLList') {
                    _started = "', jsonb_build_object("
                    _finalized = ")"
                }
                let _vfiled = "'" + v.field + _started
                _vfields.map(z=>{
                    let _ff = z.split('.')

                    //УБИРАЕМ ВСЕ ЧТО НИЖЕ 2го ВЛОЖЕНИЯ!
                    if(_ff.length < 3) {                        
                         if(_ff[1] !== 'totalRows' && _ff[1] !== '__typename'){
                             //console.log(_ff[1])
                            _vfiled += "'" + _ff[1] + "'," + '"' + v.type + '"."' + _ff[1] + '", '
                        }
                    } else {
                        //набираем поля нашего подобъекта, например nomenclature.group.id, nomenclature.group.name и т.д.
                        const _childFields = _.remove(_vfields, function(n){
                            let _rr = n.split(".")                            
                            if(_rr.length > 2){
                                if(_.indexOf(_rr, _ff[1]) === 1 ){
                                    return true
                                }
                            }else return false
                        })
                        //удаляем парента из полей (парент.поле1.поле2 => поле1.поле2)
                        const _fieldsWithoutParent = _childFields.map(cf => {
                            const _ff = _.words(cf, /[^.]+/g)
                            return _.join(_.takeRight(_ff, _ff.length - 1), '.')
                        }).filter(ff => !ff.includes("totalRows") && !ff.includes("__typename"))
                        //рекусривно создаем поля встроенного объекта
                        const _res = getSqlFieldsFunc(schema, v.type, _fieldsWithoutParent)
                        _subObjects = _.concat(_subObjects, _res.subObjects)
                        _vfiled += _res.sqlFields + ', '
                    }
                 })
                 _vfiled = _.trimEnd(_vfiled, ', ')
                _vfiled += _finalized
                _fields.push(_vfiled) 
                              
            }
        })   
        
        _.remove(_fields, function(n) {
            return n === null
        })   

        let _sqlFields =  _startFields + _fields.toString() + _endFileds
         
        return { sqlFields: _sqlFields, subObjects: _subObjects }
}

module.exports = {
    //Возвращает string в виде параметров для запроса sql
    getSqlFields: (schema, mainType, fields) => {
        return getSqlFieldsFunc(schema, mainType, fields)
    },
    getWhere: (mainType, args) => {
        let _where = _.get(args, 'where')
        if(!_where) return ''
        let _sqlWhere = ''
        let _Array = []
        let _Result = ""
        let _cond = ""
        _.forIn(_where, (value, key) => {
            switch(key) {
                case 'AND':
                    _Array = []
                    _Result = "("
                    _.forEach(value, (value) => {
                        _cond = getCondition(mainType, value)
                        if (_cond){
                            _Array.push(_cond)
                        }
                    })
                    _.take(_Array, _Array.length-1).map(a => _Result += a + ' AND ')
                    _Result += _.last(_Array) + ") "
                    if(_Result){
                        _sqlWhere += _Result
                    }
                    break
                case 'OR':
                    _Array = []
                    _Result = "("
                    _.forEach(value, (value) => {
                        _cond = getCondition(mainType, value)
                        if (_cond){
                            _Array.push(_cond)
                        }
                    })
                    _.take(_Array, _Array.length-1).map(a => _Result += a + ' OR ')
                    _Result += _.last(_Array) + ") "
                    if(_Result){
                        _sqlWhere += _Result
                    }
                    break
                default:
                    let _ff = new Object()
                    _ff[key] = value
                    _cond = getCondition(mainType, _ff) 
                    if(_.endsWith(_sqlWhere, 'AND ')){
                        _sqlWhere = _.trimEnd(_sqlWhere)
                        _sqlWhere = _.trimEnd(_sqlWhere, 'AND')
                    }
                    _sqlWhere += ' AND ' + _cond
            }
        })
        if(_.startsWith(_sqlWhere, ' AND')){
            _sqlWhere = _.trimStart(_sqlWhere)
            _sqlWhere = _.trimStart(_sqlWhere, 'AND')
        }
        
        return 'WHERE' + _sqlWhere
    },
    getPaging: (args) => {
        let _pageNum = _.get(args, 'pageNum')
        let _pageSize = _.get(args, 'pageSize')
        let _pagingSql = ''
        if(_.isNumber(_pageNum) && _.isNumber(_pageSize)) {
            if(_pageNum < 0 || _pageSize < 0) return ''
            let _offset = (_pageNum - 1) * _pageSize
            if(!_.isNumber(_offset) || _offset < 0) return ''
            _pagingSql = 'OFFSET ' + _.toString(_offset) + ' LIMIT ' + _.toString(_pageSize)
        }
        return _pagingSql
    },
    getOrder: (mainType, args) => {
        let _orderBy = _.get(args, 'orderBy')
        let _orderSql = ''
        if(_orderBy){
            _orderFields = _orderBy.split('_')
            let _orders = []
            for(var i = 0; i < _orderFields.length; i++){
                let _val = '"' + mainType + '"."' + _orderFields[i] + '"'
                if(_orderFields[i] === 'DESC' || _orderFields[i] === 'ASC') continue
                if(i < _orderFields.length -1){
                    let _r = _orderFields[i+1]
                    if(_r === 'DESC' || _r === 'ASC'){
                        _val = _val + ' ' + _r
                    }
                }
                _orders.push(_val)
            }
            //_orderSql = 'ORDER BY "' + mainType + '"."' + _orderFields[0] + '" ' + _orderFields[1]
            _orderSql = 'ORDER BY ' + _orders.toString()
        }
        return _orderSql
    },
    //преобразует результат sql в результат graphql
    getResult: (rows) => {
        //ВАРИАНТ ДЛЯ С JSON
        return _.map(rows, _.iteratee('jsonb_build_object'))
    }
}