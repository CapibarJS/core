defineApi({
  private: false,
  Function: {
    name: 'Island test',
    description: 'Create new instance ship',
  },
  method: async function (params) {
    console.log(
      schemas.Status.validate({
        params,
      }),
    );

    return { status: 'created' };
  },
});
