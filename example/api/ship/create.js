defineApi({
  Function: {
    name: 'Ship create',
    description: 'Create new instance ship'
  },

  params: schemas.Status,
  returns: ['name', 'status'],

  method: async function (params) {
    console.log(
      schemas.Status.validate({
        params,
      }),
    );

    return { status: 'created' };
  },
});
