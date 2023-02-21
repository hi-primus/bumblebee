/* eslint-disable @typescript-eslint/no-explicit-any */
declare const self, importScripts, loadPyodide;

export const initializeWorker = () => {
  // TODO: import fetch, allow scriptURL?, handle Source objects
  const fromTransferables = (value) => {
    if (typeof value === 'object' && value._blurrArrayBuffer && value.value) {
      return new ArrayBuffer(value.value);
    } else if (Array.isArray(value)) {
      return value.map(fromTransferables);
    } else if (value && typeof value === 'object') {
      const obj = {};
      for (const key in value) {
        obj[key] = fromTransferables(value[key]);
      }
      return obj;
    } else {
      return value;
    }
  };
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

      await self.micropip.install('scikit-learn');
      await self.micropip.install(
        'https://test-files.pythonhosted.org/packages/8b/62/99def385690628ec5645acd06a4c204bf2b2579ace2955efeb4c9361df5c/pyoptimus-0.1.4032-py3-none-any.whl'
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
          const kwargs = fromTransferables(e.data.kwargs);

          if (e.data.code) {
            result = self.pyodide.runPython(e.data.code);
          } else {
            const runMethod = self.pyodide.globals.get('run_method');
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
      } else if (e.data.type === 'setGlobal') {
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

        const result = [];
        let error = null;

        try {
          const value = e.data.value;
          if (value) {
            for (const key in value) {
              self.pyodide.globals.set(key, value[key]);
              self.pyodide.globals.set('lastGlobal', value[key]);
              result.push(key);
            }
          }
        } catch (err) {
          error = err.message;
        }

        self.postMessage({
          type: 'setGlobal',
          id: e.data.id,
          result,
          error,
        });
      }
    },
    false
  );
};
