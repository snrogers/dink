
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

Additionally, a Table instance can be used to define Models with customized methods for implementing model-specific access patterns


#### Delete Item
A [DeleteItem](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html) request removes an item from a table by its primary key
```js
await MyTable.deleteItem({ partitionKey: 1, sortKey: 'USER' }).exec()
```
TODO: Talk about conditions


#### Get Item
A [GetItem](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html) request fetches an item from a table by its primary key
```js
const myUser = await MyTable.GetItem({ partitionKey: 1, sortKey: 'USER' }).exec()
```
TODO: Talk about conditions


#### Put Item


#### Update Item


#### Query


#### Scan


### Model
TODO: Description of Model abstraction
