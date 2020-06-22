import { parse, parseMany } from './expression'

describe('parse(Expression)', () => {
  describe('$add', () => {
    it('produces a valid Expression from a single action', () => {
      const input =
        { $add:
          [ [ { $prop: 'testField' }, 5 ] ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('ADD #n_0 :v_0')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': 5 })
    })

    it('produces a valid Expression from multiple actions', () => {
      const input =
        { $add:
          [ [ { $prop: 'testField1' }, 5 ],
            [ { $prop: 'testField2' }, 10 ],
            [ { $prop: 'testField3' }, 33 ] ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('ADD #n_0 :v_0, #n_1 :v_1, #n_2 :v_2')
      expect(ExpressionAttributeNames).toEqual(
        { '#n_0': 'testField1',
          '#n_1': 'testField2',
          '#n_2': 'testField3' })
      expect(ExpressionAttributeValues).toEqual(
        { ':v_0': 5,
          ':v_1': 10,
          ':v_2': 33 })
    })
  })

  describe('$attributeType', () => {
    it('produces a valid Expression', () => {
      const input =
        { $attributeType: [ { $prop: 'testField' }, 'S' ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('attribute_type(#n_0, :v_0)')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': 'S' })
    })
  })

  describe('$beginsWith', () => {
    it('produces a valid Expression expression', () => {
      const input =
        { $beginsWith: [ { $prop: 'testField' }, 'testValue' ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('begins_with(#n_0, :v_0)')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': 'testValue' })
    })
  })

  describe('$between', () => {
    it('works with `$prop`s', () => {
      const input =
        { $between: [
          { $prop: 'targetField' },
          { $prop: 'boundFieldL' },
          { $prop: 'boundFieldR' } ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual(
        '#n_0 BETWEEN #n_1 AND #n_2')
      expect(ExpressionAttributeNames).toEqual(
        { '#n_0': 'targetField',
          '#n_1': 'boundFieldL',
          '#n_2': 'boundFieldR' }),
      expect(ExpressionAttributeValues).toEqual()
    })

    it('works with values', () => {
      const input = { $between: [ 1, 0, 5 ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual(
        ':v_0 BETWEEN :v_1 AND :v_2')
      expect(ExpressionAttributeNames).toEqual(),
      expect(ExpressionAttributeValues).toEqual(
        { ':v_0': 1,
          ':v_1': 0,
          ':v_2': 5 })
    })

    it('works with `$prop`s and values', () => {
      const input = { $between: [ { $prop:'targetField' }, 0, 5 ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual(
        '#n_0 BETWEEN :v_0 AND :v_1')
      expect(ExpressionAttributeNames).toEqual(
        { '#n_0': 'targetField' }),
      expect(ExpressionAttributeValues).toEqual(
        { ':v_0': 0,
          ':v_1': 5 })
    })
  })

  describe('$contains', () => {
    it('works with a String criterion', () => {
      const input =
        { $contains: [ { $prop: 'testField' }, 'testValue' ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('contains(#n_0, :v_0)')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': 'testValue' })
    })

    it('works with a String Set criterion', () => {
      const input =
        { $contains:
          [ { $prop: 'testField' },
            [ 'testValue0', 'testValue1', 'testValue2' ] ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('contains(#n_0, :v_0)')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual(
        { ':v_0': [ 'testValue0', 'testValue1', 'testValue2' ] })
    })

    it('works with a Number Set criterion', () => {
      const input =
        { $contains:
          [ { $prop: 'testField' },
            [ 0, 1, 2 ] ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('contains(#n_0, :v_0)')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual(
        { ':v_0': [ 0, 1, 2 ] })
    })

    it.skip('works with a Binary Set criterion', () => {
      const input =
        { $contains:
          [ { $prop: 'testField' },
            [ /* not even sure how to represent this */ ] ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      throw 'Test Unimplemented'

      // expect(Expression).toEqual('#n_testValue <= :v_testValue')
      // expect(ExpressionAttributeNames).toEqual({ '#n_testValue':'testValue' })
      // expect(ExpressionAttributeValues).toEqual({ ':v_testValue':0 })
    })
  })

  describe('$delete', () => {
    it('produces a valid Expression from a single action', () => {
      const input =
        { $delete:
          [ [ { $prop: 'testField' }, [ 1, 2, 3 ] ] ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('DELETE #n_0 :v_0')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': [ 1, 2, 3 ] })
    })

    it('produces a valid Expression from multiple actions', () => {
      const input =
        { $delete:
          [ [ { $prop: 'testField1' }, [ 1, 2 ] ],
            [ { $prop: 'testField2' }, [ 3, 4 ] ],
            [ { $prop: 'testField3' }, [ 5, 6 ] ] ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('DELETE #n_0 :v_0, #n_1 :v_1, #n_2 :v_2')
      expect(ExpressionAttributeNames).toEqual(
        { '#n_0': 'testField1',
          '#n_1': 'testField2',
          '#n_2': 'testField3' })
      expect(ExpressionAttributeValues).toEqual(
        { ':v_0': [ 1, 2 ],
          ':v_1': [ 3, 4 ],
          ':v_2': [ 5, 6 ] })
    })
  })

  describe('$equals', () => {
    it('produces a valid Expression expression', () => {
      const input = { $equals: [ { $prop: 'testValue' }, 0 ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('#n_0 = :v_0')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testValue' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': 0 })
    })
  })

  describe('$exists', () => {
    it('produces a valid Expression expression', () => {
      const input = { $exists: { $prop: 'testField' } }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('attribute_exists(#n_0)')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual()
    })
  })

  describe('$gt', () => {
    it('produces a valid Expression expression', () => {
      const input = { $gt: [ { $prop: 'testValue' }, 0 ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('#n_0 > :v_0')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testValue' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': 0 })
    })
  })

  describe('$gte', () => {
    it('produces a valid Expression expression', () => {
      const input = { $gte: [ { $prop: 'testValue' }, 0 ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('#n_0 >= :v_0')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testValue' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': 0 })
    })
  })

  describe('$ifNotExists', () => {
    it('produces a valid Expression', () => {
      const input =
        { $ifNotExists: [ { $prop: 'testField' }, 'some-value' ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('if_not_exists(#n_0, :v_0)')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': 'some-value' })
    })
  })

  describe('$in', () => {
    it('works with values', () => {
      const input = { $in: [ 1, 0, 1, 2 ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual(
        ':v_0 IN (:v_1, :v_2, :v_3)')
      expect(ExpressionAttributeNames).toEqual()
      expect(ExpressionAttributeValues).toEqual(
        { ':v_0': 1,
          ':v_1': 0,
          ':v_2': 1,
          ':v_3': 2 })
    })

    it('works with props', () => {
      const input =
        { $in:
          [ { $prop: 'testField0' },
            { $prop: 'testField1' },
            { $prop: 'testField2' },
            { $prop: 'testField3' } ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual(
        '#n_0 IN (#n_1, #n_2, #n_3)')
      expect(ExpressionAttributeNames).toEqual(
        { '#n_0': 'testField0',
          '#n_1': 'testField1',
          '#n_2': 'testField2',
          '#n_3': 'testField3' })
      expect(ExpressionAttributeValues).toEqual()
    })

    it('works with mixed values and props', () => {
      const input =
        { $in:
          [ { $prop: 'testField' }, 0, 1, 2 ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual(
        '#n_0 IN (:v_0, :v_1, :v_2)')
      expect(ExpressionAttributeNames).toEqual(
        { '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual(
        { ':v_0': 0,
          ':v_1': 1,
          ':v_2': 2 })
    })
  })

  describe('$listAppend', () => {
    it('produces a valid Expression', () => {
      const input =
        { $listAppend:
           [ { $prop: 'testField' }, [ 5 ] ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('list_append(#n_0, :v_0)')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': [ 5 ] })
    })
  })

  describe('$lt', () => {
    it('produces a valid Expression expression', () => {
      const input = { $lt: [ { $prop: 'testField' }, 0 ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('#n_0 < :v_0')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': 0 })
    })

    it('composes with $not operator', () => {
      const input = { $not: { $lt: [ { $prop: 'testValue' }, 0 ] } }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('NOT (#n_0 < :v_0)')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testValue' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': 0 })
    })

    it('composes with $and operator', () => {
      const input =
        { $and: [
          { $lt: [ { $prop: 'testValue1' }, 0 ] },
          { $lt: [ { $prop: 'testValue2' }, 'c' ] } ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual(
        '(#n_0 < :v_0) AND (#n_1 < :v_1)')
      expect(ExpressionAttributeNames).toEqual({
        '#n_0': 'testValue1',
        '#n_1': 'testValue2',
      })
      expect(ExpressionAttributeValues).toEqual({
        ':v_0': 0,
        ':v_1': 'c',
      })
    })

    it('composes with $or operator', () => {
      const input = { $or:
        [ { $lt: [ { $prop: 'testValue1' }, 0 ] },
          { $lt: [ { $prop: 'testValue2' }, 'c' ] } ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual(
        '(#n_0 < :v_0) OR (#n_1 < :v_1)')
      expect(ExpressionAttributeNames).toEqual({
        '#n_0': 'testValue1',
        '#n_1': 'testValue2',
      })
      expect(ExpressionAttributeValues).toEqual({
        ':v_0': 0,
        ':v_1': 'c',
      })
    })
  })

  describe('$lte', () => {
    it('produces a valid Expression expression', () => {
      const input = { $lte: [ { $prop: 'testField' }, 0 ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('#n_0 <= :v_0')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': 0 })
    })
  })

  describe('$attributeNotExists', () => {
    it('produces a valid Expression expression', () => {
      const input = { $attributeNotExists: { $prop: 'testField' } }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('attribute_not_exists(#n_0)')
      expect(ExpressionAttributeNames).toEqual({ '#n_0':'testField' })
      expect(ExpressionAttributeValues).toEqual()
    })
  })

  describe('$prop', () => {
    it('produces an expression referencing a property', () => {
      const input = { $prop: 'someField' }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('#n_0')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'someField' })
      expect(ExpressionAttributeValues).toBeUndefined()
    })
  })

  describe('$remove', () => {
    it('produces a valid Expression from a single action', () => {
      const input =
        { $remove: [ [ { $prop: 'testField' } ] ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('REMOVE #n_0')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toBeUndefined()
    })

    it('produces a valid Expression from multiple actions', () => {
      const input =
        { $remove:
          [ [ { $prop: 'testField1' } ],
            [ { $prop: 'testField2' } ],
            [ { $prop: 'testField3' } ] ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('REMOVE #n_0, #n_1, #n_2')
      expect(ExpressionAttributeNames).toEqual(
        { '#n_0': 'testField1',
          '#n_1': 'testField2',
          '#n_2': 'testField3' })
      expect(ExpressionAttributeValues).toBeUndefined()
    })
  })

  describe('$set', () => {
    it('produces a valid Expression from a single action', () => {
      const input =
        { $set:
          [ [ { $prop: 'testField' }, '=', [ 1, 2, 3 ] ] ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('SET #n_0 = :v_0')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': [ 1, 2, 3 ] })
    })

    it('produces a valid Expression from multiple actions', () => {
      const input =
        { $set:
          [ [ { $prop: 'testField0' }, '=', [ 1, 2 ] ],
            [ { $prop: 'testField1' }, '-', { $prop: 'testField2' } ],
            [ { $prop: 'testField3' }, '+', 5 ],
            [ { $listAppend: [ { $prop: 'testField4' }, [ 5, 6 ] ] } ],
            [ { $prop: 'testField5' },
              '=',
              { $ifNotExists:
                [ { $prop: 'testField6' }, 'abc' ] } ] ] }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression)
        .toEqual(
          'SET #n_0 = :v_0, '
          + '#n_1 - #n_2, '
          + '#n_3 + :v_1, '
          + 'list_append(#n_4, :v_2), '
          + '#n_5 = if_not_exists(#n_6, :v_3)')
      expect(ExpressionAttributeNames).toEqual(
        { '#n_0': 'testField0',
          '#n_1': 'testField1',
          '#n_2': 'testField2',
          '#n_3': 'testField3',
          '#n_4': 'testField4',
          '#n_5': 'testField5',
          '#n_6': 'testField6' })
      expect(ExpressionAttributeValues).toEqual(
        { ':v_0': [ 1, 2 ],
          ':v_1':  5,
          ':v_2': [ 5, 6 ],
          ':v_3': 'abc' })
    })
  })

  describe('$size', () => {
    it('produces a valid Expression expression', () => {
      const input = { $size: { $prop: 'testField' } }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('size(#n_0)')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'testField' })
      expect(ExpressionAttributeValues).toEqual()
    })
  })

  describe('Object literal => $prop equality shorthand', () => {
    it('produces an expression referencing a property', () => {
      const input = { someProp: 'someField' }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('#n_0 = :v_0')
      expect(ExpressionAttributeNames).toEqual({ '#n_0': 'someProp' })
      expect(ExpressionAttributeValues).toEqual({ ':v_0': 'someField' })
    })

    it('produces an expression referencing multiple properties', () => {
      const input = { prop_1: 'value-1', prop_2: 'value-2' }

      const output = parse(input)
      const {
        Expression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(Expression).toEqual('(#n_0 = :v_0) AND (#n_1 = :v_1)')
      expect(ExpressionAttributeNames).toEqual(
        { '#n_0': 'prop_1',
          '#n_1': 'prop_2' })
      expect(ExpressionAttributeValues).toEqual(
        { ':v_0': 'value-1',
          ':v_1': 'value-2' })
    })
  })

  describe('parseMany', () => {
    it('parses an object of expressions', () => {
      const input =
        { KeyConditionExpression: { primaryKey: 'primary-key' },
          FilterExpression: {
            $and:
            [ { field1: 'value1' },
              { $lt: [ { $prop: 'field2' }, 'value2' ] } ] },
          UpdateExpression: {
            $set:
            [ [ { $prop: 'field3' }, '=', 'a' ],
              [ { $prop: 'field4' }, '+', 10 ] ],
            $remove:
            [ [ { $prop: 'field5' } ] ] } }

      const output = parseMany(input)

      const {
        KeyConditionExpression,
        FilterExpression,
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = output

      expect(KeyConditionExpression).toEqual('#n_0 = :v_0')
      expect(FilterExpression).toEqual('(#n_1 = :v_1) AND (#n_2 < :v_2)')
      expect(UpdateExpression).toEqual(
        'SET #n_3 = :v_3, #n_4 + :v_4\n' +
        'REMOVE #n_5')
      expect(ExpressionAttributeNames).toEqual(
        { '#n_0': 'primaryKey',
          '#n_1': 'field1',
          '#n_2': 'field2',
          '#n_3': 'field3',
          '#n_4': 'field4',
          '#n_5': 'field5' })
      expect(ExpressionAttributeValues).toEqual(
        { ':v_0': 'primary-key',
          ':v_1': 'value1',
          ':v_2': 'value2',
          ':v_3': 'a',
          ':v_4': 10 })
    })
  })
})
