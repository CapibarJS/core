defineSchema({
  Schema: {name: 'user', description: 'User Schema'},

  name: 'string',
  value: 'string',
  // status: {schema: schemas.status}
  session: schemas.session.Session
});
