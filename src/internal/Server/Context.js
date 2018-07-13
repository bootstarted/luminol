class Context {
  configs = [];
  compilers = [];
  proxies = [];
  requests = [];
  apps = [];
  processes = [];
  files = {};

  getCompiler(id) {
    const compiler = this.compilers.find(({id: target}) => id === target);
    if (compiler) {
      return compiler;
    }
    const newCompiler = {id, state: '', status: 'PENDING'};
    this.compilers.push(newCompiler);
    return newCompiler;
  }

  registerApp({appId, compilerId}) {
    this.unregisterApp({appId});
    this.apps.push({id: appId, compilerId});
  }

  unregisterApp({appId}) {
    const index = this.apps.findIndex(({id}) => id === appId);
    if (index >= 0) {
      this.apps.splice(index, 1);
    }
  }

  processRequest(req) {
    const existing = this.requests.find(({id}) => id === req.id);
    if (existing) {
      Object.assign(existing, req);
      return existing;
    }
    this.requests.push(req);
    return req;
  }
}

export default Context;
