// @ts-nocheck
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

  function _mapToObject(map) {
    const obj = {};
    for (const [key, value] of map) {
      obj[key] = value;
    }
    return obj;
  }

  importScripts('https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js');

  const adaptResult = (result) => {
    if (result instanceof ArrayBuffer) {
      return result;
    } else if (self.pyodide.isPyProxy(result)) {
      try {
        if (typeof result?.toJs === 'function') {
          result = result.toJs({ dict_converter: _mapToObject });
        } else {
          throw new Error(
            'Trying to convert a PyProxy to a JS object, but the PyProxy does not have a toJs method.'
          );
        }
      } catch (err) {
        console.error(err);
      }
      return result;
    } else if (Array.isArray(result)) {
      const arr = result.map(adaptResult);
      return arr;
    } else if (result && typeof result === 'object') {
      const obj = {};
      for (const key in result) {
        obj[key] = adaptResult(result[key]);
      }
      return obj;
    } else {
      return result;
    }
  };

  let backendLoaded = false;

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
        'https://test-files.pythonhosted.org/packages/97/f1/01ff74a031b57c83c11563fd1f0b7330279640bce275f5b290a3b3cc0b32/pyoptimus-0.1.4052-py3-none-any.whl'
      );
      self.pyodide.runPython(`
        from optimus import Optimus
        from io import BytesIO
        from optimus.expressions import parse, parsed_function
        from optimus.engines.base.meta import Meta
        
        op = Optimus("pyodide")
        
        def run_method(method, kwargs):
            return method(**kwargs.to_py())
        
        def save_csv(df):
            pdf = df.data
            from io import BytesIO, TextIOWrapper
            buffer = BytesIO()
            charset = 'utf-8'
            wrapper = TextIOWrapper(buffer, encoding=charset)
            pdf.to_csv(wrapper, header=True, index=False, encoding=charset, date_format='%Y-%m-%dT%H:%M:%S.%fZ')
            wrapper.flush()
            return buffer.getvalue()
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
            usesCallback: e.data.usesCallback,
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
        } catch (err) {
          error = err.message;
        }

        result = adaptResult(result);

        try {
          self.postMessage({
            type: 'run',
            id: e.data.id,
            usesCallback: e.data.usesCallback,
            result,
            error,
          });
        } catch (err) {
          if (
            err.message.includes('could not be cloned') &&
            (e.data.kwargs?.target || e.data.code)
          ) {
            const source = {} as any;
            source.name = (e.data.kwargs?.target || e.data.code)
              .split(';')
              .pop()
              .split('\n')
              .pop()
              .trim();
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
              if (
                typeof value[key] === 'object' &&
                value[key]._blurrType === 'function'
              ) {
                value[key] = new Function(
                  'return ' + value[key].value.toString()
                )();
              }
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
