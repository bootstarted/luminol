import {Kind} from 'graphql/language';
import resolvers from '/internal/apollo/resolvers';

describe('resolvers', () => {
  describe('.DateTime', () => {
    it('should fail on serializing invalid values', () => {
      expect(() => {
        resolvers.DateTime.serialize({f: 3});
      }).toThrow(Error);
    });
    it('should fail on serializing invalid dates', () => {
      expect(() => {
        resolvers.DateTime.serialize('');
      }).toThrow(Error);
    });
    it('should fail on parsing invalid values', () => {
      expect(() => {
        resolvers.DateTime.parseValue({f: 3});
      }).toThrow(Error);
    });
    it('should serialize date objects', () => {
      expect(resolvers.DateTime.serialize(new Date('2018-01-01')));
    });
    it('should serialize date strings', () => {
      expect(resolvers.DateTime.serialize('2018-01-01'));
    });
    it('should parseValue', () => {
      expect(resolvers.DateTime.parseValue('2018-01-01'));
    });
    it('should parseLiteral for strings', () => {
      expect(
        resolvers.DateTime.parseLiteral({
          kind: Kind.STRING,
          value: '2018-01-01',
        }),
      ).not.toBe(null);
    });
    it('should parseLiteral for everything else', () => {
      expect(
        resolvers.DateTime.parseLiteral({
          kind: Kind.BOOLEAN,
          value: true,
        }),
      ).toBe(null);
    });
  });
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
    describe('.log', () => {
      it('should work', () => {
        resolvers.Mutation.log(null, {message: 'test'});
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
    describe('.registerApp', () => {
      it('should work', async () => {
        const context = {registerApp: () => {}};
        const result = await resolvers.Mutation.registerApp({}, {}, context);
        // TODO: FIXME: Implement
        expect(result);
      });
    });
    describe('.unregisterApp', () => {
      it('should work', async () => {
        const context = {unregisterApp: () => {}};
        const result = await resolvers.Mutation.unregisterApp({}, {}, context);
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
      it('should return utf8 by default', async () => {
        const logEntry = {buffer: Buffer.from('1234')};
        const result = await resolvers.Process.logs({logs: [logEntry]}, {}, {});
        // TODO: FIXME: Implement
        expect(result);
      });
      it('should work with base64', async () => {
        const logEntry = {buffer: Buffer.from('1234')};
        const result = await resolvers.Process.logs(
          {logs: [logEntry]},
          {encoding: 'BASE64'},
          {},
        );
        // TODO: FIXME: Implement
        expect(result);
      });
    });
  });
  describe('.Subscription', () => {
    describe('.logReceived', () => {
      it('should work', async () => {
        const res = await resolvers.Subscription.logReceived.subscribe();
        // TODO: FIXME: Implement
        expect(res);
      });
    });
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
