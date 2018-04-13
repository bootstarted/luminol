import resolvers from '/internal/apollo/resolvers';

describe('resolvers', () => {
  describe('.Query', () => {
    describe('.requests', () => {
      it('should work', async () => {
        const context = {requests: [{id: 1}]};
        const result = await resolvers.Query.requests({}, {}, context);
        expect(result[0].id).toBe(1);
      });
    });
    describe('.processes', () => {
      it('should work', async () => {
        const context = {processes: [{id: 1}]};
        const result = await resolvers.Query.processes({}, {}, context);
        expect(result[0].id).toBe(1);
      });
    });
    describe('.proxies', () => {
      it('should work', async () => {
        const context = {proxies: [{id: 1}]};
        const result = await resolvers.Query.proxies({}, {}, context);
        expect(result[0].id).toBe(1);
      });
    });
    describe('.compilers', () => {
      it('should work', async () => {
        const context = {compilers: [{id: 1}]};
        const result = await resolvers.Query.compilers({}, {}, context);
        expect(result[0].id).toBe(1);
      });
    });
    describe('.process', () => {
      it('should work', async () => {
        const context = {processes: [{id: 1}]};
        const result = await resolvers.Query.process(
          {},
          {processId: 1},
          context,
        );
        expect(result.id).toBe(1);
      });
    });
    describe('.compiler', () => {
      it('should work', async () => {
        const context = {compilers: [{id: 1}]};
        const result = await resolvers.Query.compiler(
          {},
          {compilerId: 1},
          context,
        );
        expect(result.id).toBe(1);
      });
    });
  });
  describe('.Mutation', () => {
    describe('.setCompilerStatus', () => {
      it('should work', async () => {
        const context = {getCompiler: () => ({})};
        const result = await resolvers.Mutation.setCompilerStatus(
          {},
          {},
          context,
        );
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.registerApp', () => {
      it('should work', async () => {
        const context = {registerApp: () => {}};
        const result = await resolvers.Mutation.registerApp({}, {}, context);
        // TODO: FIXME: Implement
        expect(result);
      });
    });

    describe('.notifyAppUpdateStatus', () => {
      it('should work', async () => {
        const context = {registerApp: () => {}};
        const result = await resolvers.Mutation.notifyAppUpdateStatus(
          {},
          {},
          context,
        );
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.notifyAppUpdateModulesUnaccepted', () => {
      it('should work', async () => {
        const context = {registerApp: () => {}};
        const res = await resolvers.Mutation.notifyAppUpdateModulesUnaccepted(
          {},
          {},
          context,
        );
        // TODO: FIXME: Implement
        expect(res);
      });
    });
    describe('.notifyAppUpdateError', () => {
      it('should work', async () => {
        const context = {registerApp: () => {}};
        const result = await resolvers.Mutation.notifyAppUpdateError(
          {},
          {},
          context,
        );
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.requestProcessed', () => {
      it('should work', async () => {
        const context = {processRequest: () => {}};
        const result = await resolvers.Mutation.requestProcessed(
          {},
          {},
          context,
        );
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.registerProcess', () => {
      it('should work', async () => {
        const context = {processes: []};
        const result = await resolvers.Mutation.registerProcess(
          {},
          {},
          context,
        );
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.processUsage', () => {
      it('should work', async () => {
        const context = {processes: []};
        const result = await resolvers.Mutation.processUsage({}, {}, context);
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.processStarted', () => {
      it('should work', async () => {
        const context = {processes: []};
        const result = await resolvers.Mutation.processStarted({}, {}, context);
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.processExited', () => {
      it('should work', async () => {
        const context = {processes: []};
        const result = await resolvers.Mutation.processExited({}, {}, context);
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.processLog', () => {
      it('should work', async () => {
        const context = {processes: []};
        const result = await resolvers.Mutation.processLog(
          {},
          {data: '', encoding: 'UTF8', processId: 5},
          context,
        );
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.registerProxy', () => {
      it('should work', async () => {
        const context = {proxies: []};
        const result = await resolvers.Mutation.registerProxy({}, {}, context);
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.updateProxy', () => {
      it('should work', async () => {
        const context = {proxies: []};
        const result = await resolvers.Mutation.updateProxy({}, {}, context);
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.unregisterProxy', () => {
      it('should work', async () => {
        const context = {proxies: []};
        const result = await resolvers.Mutation.unregisterProxy(
          {},
          {},
          context,
        );
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.setCompilerStatus', () => {
      it('should work', async () => {
        const context = {getCompiler: () => ({})};
        const result = await resolvers.Mutation.setCompilerStatus(
          {},
          {},
          context,
        );
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.publishCompilerState', () => {
      it('should work', async () => {
        const context = {getCompiler: () => ({})};
        const result = await resolvers.Mutation.publishCompilerState(
          {},
          {},
          context,
        );
        // TODO: FIXME: Implement
        expect(result);
      });
    });
  });
  describe('.Proxy', () => {
    describe('.enabled', () => {
      it('should work', async () => {
        const result = await resolvers.Proxy.enabled({}, {}, {});
        // TODO: FIXME: Implement
        expect(result);
      });
    });
  });
  describe('.Process', () => {
    describe('.logs', () => {
      it('should work', async () => {
        const result = await resolvers.Process.logs({logs: []}, {}, {});
        // TODO: FIXME: Implement
        expect(result);
      });
    });
  });
  describe('.Subscription', () => {
    describe('.processRegistered', () => {
      it('should work', async () => {
        const res = await resolvers.Subscription.processRegistered.subscribe();
        // TODO: FIXME: Implement
        expect(res);
      });
    });
    describe('.processUnregistered', () => {
      it('should work', async () => {
        const r = await resolvers.Subscription.processUnregistered.subscribe();
        // TODO: FIXME: Implement
        expect(r);
      });
    });
    describe('.requestProcessed', () => {
      it('should work', async () => {
        const res = await resolvers.Subscription.requestProcessed.subscribe();
        // TODO: FIXME: Implement
        expect(res);
      });
    });
    describe('.compilerUpdated', () => {
      it('should work', async () => {
        const res = await resolvers.Subscription.compilerUpdated.subscribe();
        // TODO: FIXME: Implement
        expect(res);
      });
    });
    describe('.proxyRegistered', () => {
      it('should work', async () => {
        const res = await resolvers.Subscription.proxyRegistered.subscribe();
        // TODO: FIXME: Implement
        expect(res);
      });
    });
  });
});
