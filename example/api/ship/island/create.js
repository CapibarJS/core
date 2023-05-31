defineApi({
  params: ['name:?string', 'value:?int'],
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
