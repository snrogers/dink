
# WARNING! This library is currently under development and is in no way production ready!

# Dink!
A library for Single-Table-Design in AWS DynamoDB

---
## Contents
* [Introduction](#introduction)
* [Usage](#usage)
  * [DB](#db)
  * [Table](#table)
  * [Model](#table)
* [Development](#development)

## Introduction
TODO: General overview of DynamoDB, motivation for Dink


## Usage
TODO: General overview of Dink overview


### DB
* [Table Definition](#table-definition)
* [Create Table](#create-table)
* [Drop Table](#drop-table)
* [Batch Get Item](#batch-get-item)
* [Batch Write Item](#batch-write-item)

#### Table Definition
#### Transactions
#### Batch Get Item
#### Batch Write Item


### Table
The `Table` class represents a DynamoDB Table. It provides methods for executing the 6 fundamental database operations supported by DynamoDB:
* [Delete Item](#delete-item)
* [Get Item](#get-item)
* [Put Item](#put-item)
* [Update Item](#update-item)
* [Query](#query)
* [Scan](#scan)
* [Define Model](#define-model)

Additionally, a Table instance can be used to define Models with customized methods for implementing model-specific access patterns


#### Delete Item
A [DeleteItem](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html) operation removes an item from a table by its primary key
```js
await MyTable.deleteItem({ partitionKey: 1, sortKey: 'USER' }).exec()
```
TODO: Talk about conditions


#### Get Item
A [GetItem](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html) operation fetches an item from a table by its primary key
```js
const myUser = await MyTable.getItem({ partitionKey: 1, sortKey: 'USER' }).exec()
```
TODO: Talk about conditions


#### Put Item
A [PutItem](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html) operation inserts an item into a Table. By default, it will act as an upsert, but this behavior can be modified by supplying a [ConditionExpression](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html)
```js
const myUser =
  { partitionKey: '1',
    sortKey: 'USER',
    user_id: '1',
    __type__: 'USER',
    name: 'Some Dude' } 

const res = await MyTable.putItem(myUser).exec()
```

#### Update Item
An [UpdateItem](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html) operation updates an existing item at specific fields. It is not for replacing an entire item. Item mutations are specified by an [UpdateExpression](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html)

```js
const myUser =
  { partitionKey: '1',
    sortKey: 'USER',
    user_id: '1',
    __type__: 'USER',
    name: 'Some Dude' } 

const res = await MyTable.putItem(myUser).exec()
```

#### Query
A [Query](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html) operation retrieves items by indexes (primary, LSI, or GSI). Greater specificity can be achieved by the use of  [FilterExpressions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html#Query.FilterExpression)

```js
const myUser = await MyTable.query({ partitionKey: 1, sortKey: 'USER' }).exec()
```

#### Scan
A [Query](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html) operation retrieves items by by apply a [FilterExpressions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html#Query.FilterExpression) across the entire table.

```js
const myUser = await MyTable.scan().filter({ '__type__': 'USER' }).exec()
```

---
#### Define Model
TODO: document `Table.prototype.defineModel(...)`


### Model
Models are defined via `myTable.model({...})` represent item types within a Table. A Model definition includes rules for generating index keys (primary and GSI), life-cycle callbacks for preparing data for insertion or use, and methods for individual model-specific access patterns. Models also provide some built-in common access patterns, e.g. `create(...)`, `insert(...)`, `upsert(...)` etc.

* [create(...)](#create)
* [insert(...)](#insert)
* [upsert(...)](#)
