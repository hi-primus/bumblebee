import { getDefaultParams, getInitParams, pythonArguments } from "bumblebee-utils";

import { readFileSync } from "fs";
const templateContents = {};

export class KernelRoutines {
  measureTime: boolean | string = false;

  constructor(measureTime) {
    this.measureTime = measureTime;
  }

  private _pythonTemplate(name: string, isCallback = true) {
    let content: string;

    if (templateContents[name]) {
      content = templateContents[name];
    } else {
      content = readFileSync("./resources/python-templates/" + name, {
        encoding: "utf8",
        flag: "r",
      });
      content = content.replace(/#{/g, "${");
      content = `\`${content}\``;
      if (isCallback) {
        content = `(payload) => ${content}`;
      }
      templateContents[name] = content;
    }
    try {
      return eval(content);
    } catch (err) {
      console.error(content)
      throw err
    }
  }

  timeStart = this._pythonTemplate("time-start.py", false);

  timeEnd = this._pythonTemplate("time-end.py", false);

  initJSON = `from optimus.helpers.json import dump_json`;

  outputJSON = (res = "res") => `dump_json(${res}, ensure_ascii=True)`;

  initVariables = this._pythonTemplate("variables.py", false);

  includeVariables = `res.update({ "variables": optimus_variables() })`;

  code = this._pythonTemplate("code.py");

  asyncCode = this._pythonTemplate("async-code.py");

  features = (payload) => {
    if (payload.optimusPath) {
      payload.optimusPath = `import sys; sys.path.append('${payload.optimusPath}')`;
    } else {
      payload.optimusPath = "";
    }
    return this._pythonTemplate("features.py", true)(payload);
  }

  getParams = (payload) => {
    let params = { ...(payload || {}) };
    params = getDefaultParams(params);
    const functionParams = pythonArguments(
      getInitParams(params.engine),
      params
    );

    switch (params.engine) {
      case "dask_coiled":
        params.coiled = true;
        params.engine = "dask";
        break;
      case "dask_cudf_coiled":
        params.coiled = true;
        params.engine = "dask_cudf";
        break;
    }

    return { params, functionParams };
  };

  init = (payload) => {
    const { params, functionParams } = this.getParams(payload);

    payload.opInit = `engine = "${params.engine}"\nop = Optimus(engine, ${functionParams})`;

    payload.params = params;

    if (payload.min) {
      return payload.opInit;
    }

    if (payload.optimusPath) {
      payload.optimusPath = `import sys; sys.path.append('${payload.optimusPath}')`;
    } else {
      payload.optimusPath = "";
    }

    return this._pythonTemplate("init.py", true)(payload);
  };
}
