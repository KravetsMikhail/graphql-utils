const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')

const OBJECTID_REGEX = /^[A-Za-z0-9]{25}$/
const MAX_INT = Number.MAX_SAFE_INTEGER
const MIN_INT = Number.MIN_SAFE_INTEGER

const scalarTypeDefs = [
  'scalar DateTime',
  'scalar ID',
  'scalar JSON',
  'scalar BigInt'
]

const scalarResolvers = {
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'Date an custom scalar type',
    parseValue(value) {
        // console.log("parseValue")
        // console.log(value)
      return new Date(value).toISOString() // value from the client
    },
    serialize(value) {
        // console.log("serilize")
        // console.log(value)
      return new Date(value).toISOString() // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        // console.log("parseLiteral")
        // console.log(ast.value)
        return new Date(ast.value).toISOString() // ast value is always in string format
      }
      return null
    },
  }),
  ID: new GraphQLScalarType({
    name: 'ObjectID',  
    description: 'A field whose value conforms with the standard object ID. Example: ckj8fbya5mhkj0786hfhhtgsp',  
    serialize(value) {
      if (!OBJECTID_REGEX.test(value)) {
        throw new TypeError(
          `Value is not a valid object id of form: ${value}`,
        )
      }
  
      return value
    },  
    parseValue(value) {
      if (!OBJECTID_REGEX.test(value)) {
        throw new TypeError(
          `Value is not a valid object id of form: ${value}`,
        )
      }
  
      return value
    },  
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) {
        throw new GraphQLError(
          `Can only validate strings as object id but got a: ${ast.kind}`,
        )
      }  
      if (!OBJECTID_REGEX.test(ast.value)) {
        throw new TypeError(
          `Value is not a valid object id of form: ${ast.value}`,
        )
      }  
      return ast.value
    },
  }),
  JSON: new GraphQLScalarType({
    name: 'JSON',
    description: 'The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).',
    serialize(value){
      return value
    } ,
    parseValue(value){
      return value
    } ,
    parseLiteral(ast){
      switch (ast.kind) {
        case Kind.STRING:
        case Kind.BOOLEAN:
          return ast.value;
        case Kind.INT:
        case Kind.FLOAT:
          return parseFloat(ast.value);
        case Kind.OBJECT:
          return parseObject(ast, variables);
        case Kind.LIST:
          return ast.values.map((n) => parseLiteral(n, variables));
        case Kind.NULL:
          return null;
        case Kind.VARIABLE: {
          const name = ast.name.value;
          return variables ? variables[name] : undefined;
        }
      }
    },
  }),
  BigInt: new GraphQLScalarType({
    name: 'BigInt',  
    description: "`BigInt` скалярный тип, целые числовые значения со знаком. Может представлять значения между -(2^53) + 1 и 2^53 - 1.",  
    serialize: coerceBigInt,
    parseValue: coerceBigInt,
    parseLiteral(ast) {
      if (ast.kind === INT) {
        const num = parseInt(ast.value, 10)
        if (num <= MAX_INT && num >= MIN_INT) {
          return num
        }else {
           			throw new TypeError("BigInt должен быть в диапазоне от -(2^53) + 1 до 2^53 - 1")
        }
      }
      else {
         		throw new TypeError(`BigInt не удалось преобразовать в целое число: ${ast.value}`)
      }
    }
  }),
}

function coerceBigInt(value) {
  if (value === '') {
    throw new TypeError(
      'Значение не может быть преобразовано из BigInt, потому что это пустая строка'
    )
  }
  const num = Number(value)
  if (num !== num || num > MAX_INT || num < MIN_INT) {
    throw new TypeError(
      'BigInt не может представлять 53-битное целое число со знаком: ' + String(value)
    )
  }
  const int = Math.floor(num)
  if (int !== num) {
    throw new TypeError(
      'BigInt не может быть нецелым числом: ' + String(value)
    )
  }
  return int
}

module.exports = {
    scalarResolvers,
    scalarTypeDefs
}