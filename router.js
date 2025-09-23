export const setRoutes = (app, prefix, storage) => {
  const callMethod = (method) => async (req, res) => {
    try {
      const result = await method(req, res);
      res.send(result);
    } catch (e) {
      res.send({
        action: 'error',
        message: e?.message ?? 'Unknown error',
      });
    }
  };

  app.get(prefix, callMethod((req) => storage.getAll(req.query)));

  app.post(prefix, callMethod((req) => storage.insert(req.body)));

  app.put(`${prefix}/:id`, callMethod((req) => storage.update(req.params.id, req.body)));

  app.delete(`${prefix}/:id`, callMethod((req) => storage.delete(req.params.id)));
};