/* eslint-disable @typescript-eslint/no-explicit-any */
declare const self, importScripts, loadPyodide;

export const initializeWorker = () => {
  // TODO: import fetch, allow scriptURL?, handle Source objects
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js');

  let backendLoaded = false;

  function _mapToObject(map) {
    const obj = {};
    for (const [key, value] of map) {
      obj[key] = value;
    }
    return obj;
  }

  async function initialize(options = {}) {
    if (!backendLoaded) {
      options = Object.assign(
        { indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.22.1/full/' },
        options
      );

      self.pyodide = await loadPyodide(options);

      await self.pyodide.loadPackage('micropip');
      self.micropip = self.pyodide.pyimport('micropip');

      await self.micropip.install(
        'https://test-files.pythonhosted.org/packages/92/4b/282d6c407b9a7e02ff0a6d19ccaa2485a945e91208f9a0332584ca6fbfd1/pyoptimus-0.1.4025-py3-none-any.whl'
      );
      self.pyodide.runPython(`
        from optimus import Optimus
        from io import BytesIO
        from optimus.expressions import parse
        op = Optimus("pyodide")
        def run_method(method, kwargs):
            return method(**kwargs.to_py())
      `);

      backendLoaded = true;
    }
  }

  let initialization;

  addEventListener(
    'message',
    async (e) => {
      if (typeof e.data !== 'object' || !e.data?.type) {
        throw new Error('Invalid message');
      }

      if (e.data.type === 'init') {
        try {
          initialization = initialize(e.data.options);
          await initialization;

          self.postMessage({
            type: 'init',
            id: e.data.id,
          });
        } catch (err) {
          self.postMessage({
            type: 'init',
            id: e.data.id,
            error: err.message,
          });
        }
      } else if (e.data.type === 'load') {
        try {
          await initialization;

          if (!backendLoaded) {
            console.warn('Backend not loaded, loading with default options...');
            await initialize();
          }
        } catch (err) {
          self.postMessage({
            type: 'load',
            id: e.data.id,
            error: err.message,
          });
          return;
        }

        try {
          if (e.data.packages && e.data.packages.length > 0) {
            await self.pyodide.loadPackage(e.data.packages);
          }

          self.postMessage({
            type: 'load',
            id: e.data.id,
          });
        } catch (err) {
          self.postMessage({
            type: 'load',
            id: e.data.id,
            error: err.message,
          });
        }
      } else if (e.data.type === 'run') {
        try {
          await initialization;

          if (!backendLoaded) {
            console.warn('Backend not loaded, loading with default options...');
            await initialize();
          }
        } catch (err) {
          self.postMessage({
            type: 'load',
            id: e.data.id,
            error: err.message,
          });
          return;
        }

        let result = null;
        let error = null;

        try {
          if (e.data.code) {
            result = self.pyodide.runPython(e.data.code);
          } else {
            const runMethod = self.pyodide.globals.get('run_method');
            const kwargs = e.data.kwargs;
            for (const key in kwargs) {
              const kwarg = kwargs[key];
              if (typeof kwarg === 'object' && kwarg._blurrArrayBuffer) {
                kwargs[key] = new ArrayBuffer(kwarg.value);
              }
            }
            result = runMethod(e.data.method, kwargs);
          }

          try {
            result =
              typeof result?.toJs === 'function'
                ? result.toJs({ dict_converter: _mapToObject })
                : result;
          } catch (error) {
            console.warn('Error converting to JS.', error);
          }
        } catch (err) {
          error = err.message;
        }

        try {
          self.postMessage({
            type: 'run',
            id: e.data.id,
            result,
            error,
          });
        } catch (err) {
          if (err.message.includes('could not be cloned')) {
            const source = {} as any;
            source.name = e.data.kwargs?.target;
            source._blurrMember = 'source';
            self.postMessage({
              type: 'run',
              id: e.data.id,
              result: source,
            });
          } else {
            self.postMessage({
              type: 'run',
              id: e.data.id,
              result: null,
              error: err.message,
            });
          }
        }
      }
    },
    false
  );
};
