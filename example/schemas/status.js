defineSchema({
  Schema: 'status',

  name: '?string',
  value: 'int',
  parent: { schema: schemas.Status, required: false },
  user: { schema: schemas.User, required: true },
});
