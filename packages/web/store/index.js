import Vue from 'vue'

import {
  capitalizeString, getPropertyAsync, filterCells, parseResponse, printError, deepCopy, objectMap,
  ALL_TYPES, INCOMPATIBLE_ENGINES
 } from 'bumblebee-utils'
import { generateCode } from 'optimus-code-api'

const properties = [
  {
    name: 'loadPreview',
    setter: false,
    clear: true,
  },
  {
    name: 'DatasetUpdate',
    default: ()=>1,
    multiple: true
  },
  {
    name: 'PreviewColumns',
    clear: true,
    clearOnSelection: true,
    multiple: true,
  },
  {
    name: 'profilePreview',
    clear: true,
    clearOnSelection: true,
    default: ()=>({
      rowHighlights: false,
      newColumns: false
    }),
  },
  {
    name: 'PreviewInfo',
    clear: true,
    clearOnSelection: true,
    multiple: true,
  },
  {
    name: 'HiddenColumns',
    clear: true,
    clearOnLoad: true,
    multiple: true,
  },
  {
    name: 'Highlights',
    clear: true,
    clearOnSelection: true,
    multiple: true,
  },
  {
    name: 'previewCode',
    clear: true,
    clearOnLoad: true,
    clearOnSelection: true
  },
  {
    name: 'DuplicatedColumns',
    clear: true,
    clearOnLoad: true,
    clearOnSelection: true,
    multiple: true,
  },
  {
    name: 'PreviewNames',
    clear: true,
    clearOnSelection: true,
    multiple: true,
  },
  {
    name: 'FocusedColumns',
    clear: true,
    clearOnSelection: true,
    multiple: true,
  }
]

var pStates = {}

properties.forEach((p)=>{
  if (p.multiple) {
    pStates['every'+p.name] = []
  } else {
    pStates[p.name] = false
  }
})

const defaultState = {
  dashboardLink: '',
  updatingProfile: false,
  updatingDataset: false,
  updatingWorkspace: false,
  updatingPreview: false,
  updatingWholeProfile: false,
  updatingPreviewProfile: false,
  editing: false,
  afterProfileCallback: false,
  coiledAvailable: false,
  tab: 0,
  cells: { dataSources: [], transformations: [], status: 'ok' },
  lastCorrectCells: { dataSources: [], transformations: [], status: 'ok' },
  workspace: false,
  datasets: [],
  datasetSelection: [],
  databases: [],
  firstRun: true,
  commandsDisabled: false,
  lastWrongCode: false,
  enableReload: false,
  errorAlerts: [],
  noMatch: false,
  showingColumnsLength: 0,
  codeDone: '',
  enginePromise: false,
  connectionsPromise: false,
  featuresPromise: false,
  optimusPromise: false,
  workspacePromise: false,
  cellsPromise: false,
  sampledDatasets: {},
  profilingsPromises: {},
  executePromises: {},
  columns: {},
  listViews: [],
  gettingNewResults: '',
  localEngineParameters: {},
  engineId: false,
  engineConfigName: false,
  connections: false,
  enableIncrementalProfiling: true
}

export const state = () => {

  return {
    ...objectMap(defaultState, e => deepCopy(e)),
    workspaceSlug: false,
    properties,
    ...pStates,

    //

    appStatus: {status: 'waiting'},

    allTypes: ALL_TYPES,
    kernel: false,
    nextCommand: false,
    unavailableEngines: [],
    reservedWords: JSON.parse(`{\"functions\": {\"MIN\": {\"description\": \"Returns the minimum value in a numeric dataset.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"Column name or value.\"}], \"example\": \"MIN(COL_NAME)\", \"text\": \"MIN\"}, \"MAX\": {\"description\": \"Returns the maximum value in a numeric dataset.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"Column name or value.\"}], \"example\": \"MIN(COL_NAME)\", \"text\": \"MAX\"}, \"MEAN\": {\"description\": \"Returns the numerical average value in a dataset, ignoring text.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"Column name or value.\"}], \"example\": \"MEAN(COL_NAME)\", \"text\": \"MEAN\"}, \"MODE\": {\"description\": \"Returns the most commonly occurring value in a dataset.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"Column name or value.\"}], \"example\": \"MODE(COL_NAME)\", \"text\": \"MODE\"}, \"STD\": {\"description\": \"Calculates the standard deviation based on a sample.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"Column name or value.\"}], \"example\": \"STD(COL_NAME)\", \"text\": \"STD\"}, \"SUM\": {\"description\": \"Returns the sum of a series of numbers and/or cells.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"Column name or value.\"}], \"example\": \"SUM(COL_NAME)\", \"text\": \"SUM\"}, \"VAR\": {\"description\": \"Calculates the variance based on a sample.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"Column name or value.\"}], \"example\": \"VAR(COL_NAME)\", \"text\": \"VAR\"}, \"KURTOSIS\": {\"description\": \"Calculates the kurtosis of a dataset, which describes the shape, and in particular the 'peakedness' of that dataset.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"Column name or value.\"}], \"example\": \"KURT(COL_NAME)\", \"text\": \"KURT\"}, \"SKEW\": {\"description\": \"Calculates the skewness of a dataset, which describes the symmetry of that dataset about the mean.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"Column name or value.\"}], \"example\": \"SKEW(COL_NAME)\", \"text\": \"SKEW\"}, \"MAD\": {\"description\": \"Calculates the skewness of a dataset, which describes the symmetry of that dataset about the mean.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"Column name or value\"}], \"example\": \"MAD(COL_NAME)\", \"text\": \"MAD\"}, \"ABS\": {\"description\": \"Returns the absolute value of a number.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The number of which to return the absolute value.\"}], \"example\": \"ABS(-2)\", \"text\": \"ABS\"}, \"MOD\": {\"description\": \"Returns the result of the modulo operator, the remainder after a division operation.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The number to be divided to find the remainder.\"}, {\"type\": \"number\", \"name\": \"divisor\", \"description\": \"The number to divide by.\"}], \"example\": \"MOD(10, 4)\", \"text\": \"MOD\"}, \"EXP\": {\"description\": \"Returns Euler's number, e (~2.718) raised to a power.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The number of which to return the absolute value.\"}], \"example\": \"ABS(-2)\", \"text\": \"EXP\"}, \"LOG\": {\"description\": \"Returns the logarithm of a number with respect to a base.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The value for which to calculate the logarithm.\"}], \"example\": \"LOG(128, 2)\", \"text\": \"LOG\"}, \"LN\": {\"description\": \"Returns the logarithm of a number, base e (Euler's number).\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The value for which to calculate the logarithm, base e.\"}], \"example\": \"LN(100)\", \"text\": \"LN\"}, \"POW\": {\"description\": \"Returns a number raised to a power.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The number to raise to the exponent power.\"}, {\"type\": \"number\", \"name\": \"exponent\", \"description\": \"The exponent to raise base to.\"}], \"example\": \"POW(4, 0.5)\", \"text\": \"POW\"}, \"CEIL\": {\"description\": \"Rounds a number up to the nearest integer multiple of specified significance factor.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The value to round up to the nearest integer multiple of factor.\"}], \"example\": \"CEILING(23.25)\", \"text\": \"CEIL\"}, \"SQRT\": {\"description\": \"Returns the positive square root of a positive number.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The number for which to calculate the positive square root.\"}], \"example\": \"SQRT(9)\", \"text\": \"SQRT\"}, \"FLOOR\": {\"description\": \"Rounds a number down to the nearest integer multiple of specified significance factor.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The value to round down to the nearest integer multiple of factor.\"}], \"example\": \"FLOOR(23.25)\", \"text\": \"FLOOR\"}, \"ROUND\": {\"description\": \"Rounds a number to a certain number of decimal places according to standard rules.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The value to round to places number of places.\"}, {\"type\": \"number\", \"name\": \"decimals\", \"description\": \"The value to round to places number of places.\"}], \"example\": \"ROUND(99.44, 1)\", \"text\": \"ROUND\"}, \"SIN\": {\"description\": \"Returns the sin of an angle provided in radians.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The angle to find the sine of, in radians.\"}], \"example\": \"SIN(3.14)\", \"text\": \"SIN\"}, \"COS\": {\"description\": \"Returns the cosine of an angle provided in radians.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The angle to find the cosine of, in radians.\"}], \"example\": \"COS(3.14)\", \"text\": \"COS\"}, \"TAN\": {\"description\": \"Returns the tangent of an angle provided in radians.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The angle to find the tangent of, in radians.\"}], \"example\": \"TAN(3.14)\", \"text\": \"TAN\"}, \"ASIN\": {\"description\": \"Returns the inverse sine of a value, in radians.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The value for which to calculate the inverse sine. Must be between -1 and 1, inclusive.\"}], \"example\": \"ASIN(0)\", \"text\": \"ASIN\"}, \"ACOS\": {\"description\": \"Returns the inverse cosine of a value, in radians.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The value for which to calculate the inverse cosine. Must be between -1 and 1, inclusive.\"}], \"example\": \"ACOS(0)\", \"text\": \"ACOS\"}, \"ATAN\": {\"description\": \"Returns the inverse tangent of a value, in radians.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The value for which to calculate the inverse tangent.\"}], \"example\": \"ATAN(0)\", \"text\": \"ATAN\"}, \"SINH\": {\"description\": \"Returns the hyperbolic sine of any real number.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"Any real value to calculate the hyperbolic sine of.\"}], \"example\": \"SINH(2)\", \"text\": \"SINH\"}, \"COSH\": {\"description\": \"Returns the hyperbolic cosine of any real number.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"Any real value to calculate the hyperbolic cosine of.\"}], \"example\": \"COSH(0.48)\", \"text\": \"COSH\"}, \"TANH\": {\"description\": \"Returns the hyperbolic tangent of any real number.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"Any real value to calculate the hyperbolic tangent of.\"}], \"example\": \"TANH(1)\", \"text\": \"TANH\"}, \"ASINH\": {\"description\": \"Returns the hyperbolic tangent of any real number.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The value for which to calculate the inverse hyperbolic sine.\"}], \"example\": \"ASINH(0.9)\", \"text\": \"ASINH\"}, \"ACOSH\": {\"description\": \"Returns the inverse hyperbolic cosine of a number.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The value for which to calculate the inverse hyperbolic cosine. Must be greater than or equal to 1.\"}], \"example\": \"ACOSH(2)\", \"text\": \"ACOSH\"}, \"ATANH\": {\"description\": \"Returns the inverse hyperbolic tangent of a number.\", \"parameters\": [{\"type\": [\"column\", \"number\"], \"name\": \"col_name\", \"description\": \"The value for which to calculate the inverse hyperbolic tangent. Must be between -1 and 1, exclusive.\"}], \"example\": \"ATANH(0.9)\", \"text\": \"ATANH\"}, \"UPPER\": {\"description\": \"Returns the inverse hyperbolic tangent of a number.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"Converts a specified string to uppercase.\"}], \"example\": \"UPPER('lorem ipsum')\", \"text\": \"UPPER\"}, \"LOWER\": {\"description\": \"Converts a specified string to lowercase.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"The string to convert to lowercase.\"}], \"example\": \"LOWER('LOREM IPSUM')\", \"text\": \"LOWER\"}, \"PROPER\": {\"description\": \"Capitalizes each word in a specified string.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"The text which will be returned with the first letter of each word in uppercase and all other letters in lowercase.\"}], \"example\": \"PROPER('optimus prime')\", \"text\": \"PROPER\"}, \"TRIM\": {\"description\": \"Removes leading, trailing, and repeated spaces in text.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"The text or reference to a cell containing text to be trimmed.\"}], \"example\": \"TRIM('optimus prime')\", \"text\": \"TRIM\"}, \"LEN\": {\"description\": \"Returns the length of a string.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"The string whose length will be returned.\"}], \"example\": \"LEN('optimus prime')\", \"text\": \"LEN\"}, \"FIND\": {\"description\": \"Returns the position at which a string is first found.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"The string to look for.\"}, {\"type\": \"string\", \"name\": \"text_to_search\", \"description\": \"The text to search for the first occurrence of search_for.\"}], \"example\": \"LEN('optimus prime')\", \"text\": \"LEN\"}, \"RFIND\": \"RFIND\", \"LEFT\": {\"description\": \"Returns a substring from the beginning of a specified string.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"The string from which the left portion will be returned.\"}], \"example\": \"LEFT('Optimus', 2)\", \"text\": \"LEN\"}, \"RIGHT\": {\"description\": \"Returns a substring from the end of a specified string.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"The string from which the right portion will be returned.\"}], \"example\": \"LEN('optimus prime')\", \"text\": \"LEN\"}, \"STARTS_WITH\": \"STARTS_WITH\", \"ENDS_WITH\": \"ENDS_WITH\", \"EXACT\": \"EXACT\", \"YEAR\": {\"description\": \"Returns the year specified by a given date.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"The date from which to extract the year.\"}], \"example\": \"YEAR()\", \"text\": \"YEAR\"}, \"MONTH\": {\"description\": \"Returns the month of the year a specific date falls in, in numeric format.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"The date from which to extract the month.\"}], \"example\": \"MONTH()\", \"text\": \"MONTH\"}, \"DAY\": {\"description\": \"Returns the day of the month that a specific date falls on, in numeric format.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"The date from which to extract the day.\"}], \"example\": \"DAY()\", \"text\": \"DAY\"}, \"HOUR\": {\"description\": \"Returns the hour component of a specific time, in numeric format.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"The time from which to calculate the hour value.\"}], \"example\": \"HOUR()\", \"text\": \"HOUR\"}, \"MINUTE\": {\"description\": \"Returns the minute component of a specific time, in numeric format.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"The time from which to calculate the minute value.\"}], \"example\": \"MINUTE()\", \"text\": \"MINUTE\"}, \"SECOND\": {\"description\": \"Returns the second component of a specific time, in numeric format.\", \"parameters\": [{\"type\": [\"column\", \"string\"], \"name\": \"col_name\", \"description\": \"The time from which to calculate the second value\"}], \"example\": \"SECOND()\", \"text\": \"SECOND\"}}, \"operators\": {\"unary\": {\"~\": \"~ function description\", \"|\": \"| function description\", \"&\": \"& function description\", \"+\": \"+ function description\", \"-\": \"- function description\"}, \"binary\": {\"+\": \"+ function description\", \"-\": \"- function description\", \"*\": \"* function description\", \"/\": \"/ function description\", \"%\": \"- function description\"}}}`),
    stopWordsLanguages: ['arabic', 'azerbaijani', 'bengali', 'danish', 'dutch', 'english', 'finnish', 'french', 'german', 'greek', 'hungarian', 'indonesian', 'italian', 'kazakh', 'nepali', 'norwegian', 'portuguese', 'romanian', 'russian', 'slovene', 'spanish', 'swedish', 'tajik', 'turkish']
  }
}

var pSetters = {}

properties.forEach((p)=>{
  if (p.setter!==false) {
    if (p.multiple) {
      pSetters['set'+capitalizeString(p.name)] = function(state, payload) {
        Vue.set( state['every'+p.name], state.tab, payload )
      }
    } else {
      pSetters['set'+capitalizeString(p.name)] = function(state, payload) {
        state[p.name] = payload
      }
    }
  }
})

export const mutations = {

  mutation (state, {mutate, payload}) {
    Vue.set(state, mutate, payload)
  },

  copyCellsIfOk (state) {
    if (state.cells.status == 'ok') {
      state.lastCorrectCells = deepCopy(state.cells);
    }
  },

  checkCellsStatus (state) {
    let cells = [...state.cells.transformations, ...state.cells.dataSources];
    let status = cells.some(c => c.error) ? "error" : "ok";
    if (status != state.cells.status) {
      let stateCells = {...state.cells};
      stateCells.status = status;
      if (status == "ok") {
        stateCells.error = undefined;
      }
      state.cells = stateCells;
    }
  },

  setTransformations (state, transformations) {
    Vue.set(state.cells, 'transformations', transformations);
    this.commit('checkCellsStatus');
  },

  setDataSources (state, dataSources) {
    Vue.set(state.cells, 'dataSources', dataSources);
    this.commit('checkCellsStatus');
  },

  setCells (state, cells) {
    let dataSources = cells.filter(e=>e && e.payload && e.payload.request && e.payload.request.isLoad);
    let transformations = cells.filter(e=>!(e && e.payload && e.payload.request && e.payload.request.isLoad));

    let stateCells = {...state.cells};

    stateCells.status = cells.some(c => c.error) ? "error" : "ok";
    stateCells.dataSources = dataSources;
    stateCells.transformations = transformations;
    state.cells = stateCells;
  },

  appendError(state, {error, cells}) {
    if (typeof error == "string") {
      error = {
        content: error,
        id: Number(new Date())
      }
    }
    Vue.set(state.errorAlerts, state.errorAlerts.length, error);
    if (cells) {
      state.cells = {...deepCopy(state.cells), error: error.id}
    }
  },

  setRetry (state, retry) {
    if (state.previewCode?.codePayload?.request) {
      state.previewCode.codePayload.request.retry = retry;
      
      // updates the code
      let request = state.previewCode.codePayload.request;
      let command = state.previewCode.codePayload.command;
      let payload = state.previewCode.codePayload;
      state.previewCode.code = generateCode({ command, payload }, request)[0];

    }
  },
  
  removeErrorAlert(state, id) {
    if (id == "all") {
      state.errorAlerts = [];
    } else {
      let index = state.errorAlerts.findIndex(e => e.id==id);
      Vue.delete(state.errorAlerts, index);
    }
  },

  updateDataset (state, { tab }) {
    Vue.set(state.everyDatasetUpdate, tab, (state.everyDatasetUpdate[tab] || 0) + 1);
  },

  setSampledDataset (state, { df, sampled }) {
    sampled = (sampled === undefined) ? true : sampled;
    state.sampledDatasets[df] = false;
    Vue.set(state.sampledDatasets, df, sampled);
  },

  setColumns (state, { dfName, columns }) {
    Vue.set(state.columns, dfName, columns);
  },

  clearSession (state) {
    console.debug('%c[SESSION] Clear','color: yellow;');
    Object.keys(defaultState).forEach(key=>{
      Vue.set(state, key, deepCopy(defaultState[key]));
    });
    state.properties.filter(p=>p.clear).forEach(p=>{
      if (p.multiple) {
        state['every'+p.name] = [];
      } else {
        state[p.name] = false;
      }
    });
  },

  ...pSetters,

  setLoadPreview (state, {sample, profile, meta}) {
    state.loadPreview = state.loadPreview || {}

    // TO-DO: Optimize (only one Vue.set)
    if (sample !== undefined) {
      Vue.set(state.loadPreview, 'sample', sample)
    }
    if (profile !== undefined) {
      Vue.set(state.loadPreview, 'profile', profile)
    }
    if (meta !== undefined) {
      Vue.set(state.loadPreview, 'meta', meta)
    }
  },

  setHighlights (state, { matchColumns, color }) {
    var highlights = { matchColumns: matchColumns || {}, color: color || 'green' }

    Vue.set( state.everyHighlights, state.tab, highlights )
  },

  previewDefault (state, payload) {
    var names = payload ? payload.names : undefined;
    state.properties.filter(p=>p.clear).forEach(p=>{
      if (!names || !names.length || names.includes(p.name)) {
        if (p.multiple) {
          Vue.set(state['every'+p.name], state.tab, false)
        } else {
          state[p.name] = false
        }
      }
    })
  },

  commandHandle(state, command) {
    state.nextCommand = command
  },

  setListView(state, listView) {
    Vue.set(state.listViews,state.tab,listView)
  },

	setDataset (state, { dataset, preview, tab, avoidReload, partial }) {

    if (!avoidReload) {
      console.log("[BUMBLEBLEE] Opening dataset", dataset);
    }

    var fileName = dataset.file_name;

    if (Array.isArray(fileName)) {
      fileName = fileName[fileName.length-1];
    }

    if (fileName && fileName.includes('/')) {
      fileName = fileName.split('/');
      fileName = fileName[fileName.length - 1];
    }

    if (fileName) {
      fileName = fileName.replace(/%20/g, " ");
    }

    dataset.file_name = fileName

    if (!dataset.name) {
      if (dataset.file_name) {
        dataset.name = dataset.file_name.replace(/\.[^/.]+$/, "");
      } else {
        dataset.name = `Dataset`;
      }
    } else {
      dataset.name = dataset.name.replace(/%20/g, " ").replace(/\.(csv|xls|xlsx|avro|json|parquet)$/i, "");
    }

    if (preview) {
      dataset.preview = preview;
    } else {
      dataset.blank = false;
    }

    var found = state.datasets.findIndex(ds => ds.dfName===dataset.dfName)


    if (!Array.isArray(dataset.columns)) {
      dataset._columns = dataset.columns;
      if (partial && state.datasets[found] && state.datasets[found]._columns) {
        dataset._columns = { ...state.datasets[found]._columns, ...dataset._columns };
      }
      dataset.columns = Object.entries(dataset._columns).map(([key, value])=>({...value, name: key}));
    }

    if (tab === undefined) {
      if (found >= 0) {
        tab = found;
      } else if (state.datasets[state.tab] && state.datasets[state.tab].blank) {
        tab = state.tab;
      } else {
        console.debug('%c[TAB MANAGING] Loading profiling without tab','color: yellow;');
      }
    }

    var previousDataset = state.datasets[tab] || {};

    if (previousDataset.dfName) {
      dataset.dfName = previousDataset.dfName;
    }

    Vue.set(state.datasets, tab, dataset);

    if (!avoidReload) {
      console.debug("[BUMBLEBLEE] Setting dataset", dataset);

      var previousSelection;
      try {
        previousSelection = state.datasetSelection[tab].columns || [];
      } catch (err) {
        previousSelection = [];
      }

      for (let i = previousSelection.length - 1; i >= 0; i--) {
        let col = previousSelection[i];
        let new_index = dataset.columns.findIndex(_col=>_col.name === col.name);
        if (new_index >= 0) {
          previousSelection[i].index = new_index;
        } else if (dataset.columns.length == previousSelection.length) {
          previousSelection[i].name = dataset.columns[i].name
        } else {
          delete previousSelection[i];
        }
      }

      Vue.set(state.datasetSelection, tab, { columns: previousSelection } );

      state.properties.filter(p=>p.clearOnLoad).forEach(p=>{
        if (p.multiple) {
          Vue.set(state['every'+p.name], tab, false);
        } else {
          state[p.name] = false;
        }
      });

      if (!avoidReload) {
        Vue.set(state.everyDatasetUpdate, tab, (state.everyDatasetUpdate[tab] || 0) + 1);
      }
    }

    return dataset;

  },

  newDataset (state, { current, dataset, tab, dfName, go }) {
    let found = -1

    if (dfName) {
      found = state.datasets.findIndex(dataset => dataset.dfName===dfName)
      if (found<0 && current) {
        console.warn('[DATASET] trying to overwrite unexistenting',dfName)
        return
      }
    }

    if (current && !dfName) {
      found = (tab !== undefined) ? tab : state.tab
    }

    if (found<0) {
      found = state.datasets.length
    }


    dataset = {
      name: '(new dataset)',
      blank: true,
      ...(dataset || {})
    }

    state.loadPreview = false
    Vue.set(state.datasets, found, dataset)
    Vue.set(state.datasetSelection, found, {})

    if (go) {
      state.tab = found;
      state.updatingProfile = false;
      state.updatingWholeProfile = false;
      state.updatingPreviewProfile = false;
    }

    Vue.set(state.everyDatasetUpdate, state.tab, (state.everyDatasetUpdate[state.tab] || 0) + 1);

    return state.tab;
  },

  unsetDf (state, { dfName }) {
    this.commit('newDataset', { current: true, dfName })
  },

  setDfToTab (state, { dfName, go }) {

    // doesn't sets if there's already a dataset with the same dfName
    var foundIndex = state.datasets.findIndex(dataset => dataset.dfName===dfName)

    if (foundIndex>=0) {
      if (go) {
        state.tab = foundIndex;
      }
      return
    }

    // sets to a blank tab (starting from current tab)
    foundIndex = state.datasets.findIndex((dataset, index) => index>=state.tab && !dataset.dfName && dataset.blank)

    if (foundIndex>=0) {
      Vue.set(state.datasets[foundIndex], 'dfName', dfName)
      state.tab = foundIndex;
      return
    }

    // sets to a new tab otherwise
    console.warn('[COMMANDS] creating tab for', dfName)
    this.commit('newDataset', { dataset: { dfName, go } })

  },

	deleteTab (state, index) {
    var dfName = state.datasets[index].dfName;

    if (dfName) {
      Vue.delete(state.profilingsPromises, dfName);
      Vue.delete(state.executePromises, dfName);
    }

    Vue.delete(state.datasets, index);
    Vue.delete(state.datasetSelection, index);
    state.properties.forEach(p=>{
      if (p.multiple) {
        Vue.delete(state['every'+p.name], index);
      }
    })
    if (!state.datasets.length) {
      this.commit('newDataset', {});
    }
    return Math.min(index, state.datasets.length);
	},

	setAppStatus (state, payload) {
    state.appStatus = payload || { status: 'waiting' }
  },

  setCellCode (state, {index, code}) {
    try {
      var cells = state.cells || {};
      cells.transformations[index].code = code;
      state.cells = cells;
    } catch (error) {
      console.error(error);
    }
  },

  updateCell (state, {id, cell}) {

    let cellArrays = ['dataSources', 'transformations'];

    let _cells = deepCopy(state.cells);

    for (let i = 0; i < cellArrays.length; i++) {
      const arr = cellArrays[i];
      for (let j = 0; j < _cells[arr].length; j++) {
        const _cell = _cells[arr][j];
        if (_cell.id == id) {
          _cells[arr][j] = cell;
          state.cells = _cells;
          return;
        }
      }
    }
  },

  deleteCell (state, {id}) {

    let cellArrays = ['dataSources', 'transformations'];

    let _cells = deepCopy(state.cells);

    for (let i = 0; i < cellArrays.length; i++) {
      const arr = cellArrays[i];
      for (let j = 0; j < _cells[arr].length; j++) {
        const _cell = _cells[arr][j];
        if (_cell.id == id) {
          _cells[arr].splice(j, 1);
          state.cells = _cells;
          return;
        }
      }
    }
  },

  database (state, payload) {
    Vue.set(state.databases,state.tab,payload)
  },

  kernel (state, payload) {
    state.kernel = payload
  },

  setPreviewInfo (state, {rowHighlights, newColumns, replacingColumns, error}) {
    if (!state.everyPreviewInfo[state.tab]) {
      state.everyPreviewInfo[state.tab] = {};
    }
    if (rowHighlights!=undefined) {
      state.everyPreviewInfo[state.tab].rowHighlights = rowHighlights;
    }
    if (newColumns!=undefined) {
      state.everyPreviewInfo[state.tab].newColumns = Math.max(0, newColumns);
    }
    if (replacingColumns!=undefined) {
      state.everyPreviewInfo[state.tab].replacingColumns = Math.max(0, replacingColumns);
    }
    if (replacingColumns!=undefined) {
      state.everyPreviewInfo[state.tab].replacingColumns = replacingColumns
    }
    if (error !== undefined) {
      if (error.data) {
        error = error.data;
      }
      state.everyPreviewInfo[state.tab].error = error.error || error.message || error;
    }
    Vue.set(state.everyPreviewInfo,state.tab,state.everyPreviewInfo[state.tab]);
  },

  selection (state, {tab, columns, ranged, clear, text} = {} ) {

    if (tab === undefined) {
      tab = state.tab;
    }

    if (tab === undefined) {
      return;
    }

    var current = state.datasetSelection[tab]

    if (
      !ranged && !text && !(columns && columns.length)
      &&
      !current.ranged && !current.text && !(current.columns && current.columns.length)
    ) {
      return
    }

    if (clear) {
      Vue.set(state.datasetSelection,tab,{
        columns: [],
        ranged: undefined,
        text: undefined
      })
      return
    }

    var columnsSelected = []
    var rangedSelected = undefined
    var textSelected = undefined

    if (ranged===undefined && text===undefined) {
      if (columns !== undefined) {
        columnsSelected = columns
      } else if (state.datasetSelection[tab]) {
        columnsSelected = state.datasetSelection[tab].columns || []
      }
    }

    if (!columnsSelected.length && text===undefined) {
      if (ranged!==undefined) {
        rangedSelected = ranged
      } else if (state.datasetSelection[tab]) {
        rangedSelected = state.datasetSelection[tab].ranged || {}
      }
    }

    if (!columnsSelected.length && (!rangedSelected || !Object.keys(rangedSelected).length)) {
      if (text !== undefined) {
        textSelected = text
      } else if (state.datasetSelection[tab]) {
        textSelected = state.datasetSelection[tab].text || {}
      }
    }

    Vue.set(state.datasetSelection,tab,{
      columns: columnsSelected,
      ranged: rangedSelected,
      text: textSelected
    })

  },

  clearSelectionProperties (state) {
    let tab = state.tab;
    state.properties.filter(p=>p.clearOnSelection).forEach(p=>{
      if (p.multiple) {
        Vue.set(state['every'+p.name], tab, false)
      } else {
        state[p.name] = false
      }
    })
  }

}

export const actions = {

  async nuxtServerInit ({ dispatch, commit, app }, context) {
    await dispatch('session/serverInit')
  },

  checkSocketPost ({ commit }, socketPost) {
    if (typeof socketPost !== 'function') {
      commit('mutation', { mutate: 'enableReload', payload: true });
      throw new Error('Error connecting to Optimus');
    } else {
      commit('mutation', { mutate: 'enableReload', payload: false });
    }
  },

  async evalCode ({ dispatch, state, getters }, { code, codePayload, reply, category, isAsync, socketPost }) {
    try {

      reply = reply || 'await';

      if (codePayload && typeof codePayload == "object" && !Array.isArray(codePayload)) {
        codePayload = [codePayload];
      }

      if (codePayload && codePayload.length) {
        for (let i = 0; i < codePayload.length; i++) {
          Object.keys(codePayload[i]).forEach(key => {
            if (key.startsWith("__")) {
              codePayload[i][key] = undefined;
            }
          });
          if (codePayload[i] && codePayload[i].request) {
            isAsync = isAsync || codePayload[i].request.isAsync;
          }
        }
      }

      if (!process.client) {
        throw new Error('SSR not allowed')
      }

      let startTime = new Date().getTime();

      await dispatch('checkSocketPost', socketPost);

      let promise = socketPost('run', {
        code,
        codePayload,
        reply,
        category,
        isAsync,
        username: await dispatch('session/getUsername'),
        workspace: state.workspaceSlug || 'default'
      });

      if (reply == 'await') {
        let response = await promise;
        let endTime = new Date().getTime()
  
        response._frontTime = {
          start: startTime/1000,
          end: endTime/1000,
          duration: (endTime - startTime)/1000
        }
  
        if (window.verbose_responses) {
          console.debug('[DEBUG][RESULT]', response)
          console.debug('[DEBUG][CODE]', response.code)
  
          try {
            console.debug(//time
              '[DEBUG][TIMES]',
              'front', response._frontTime,
              'queue', response.data._queueTime,
              'server', response.data._serverTime,
              'gateway', response.data._gatewayTime,
              'frontToQueue', response.data._queueTime.start-response._frontTime.start,
              'queueToServer', response.data._serverTime.start-response.data._queueTime.start,
              'serverToGateway', response.data._gatewayTime.start-response.data._serverTime.start,
              'gatewayToServer', response.data._serverTime.end-response.data._gatewayTime.end,
              'serverToQueue', response.data._queueTime.end-response.data._serverTime.end,
              'queueToFront', response._frontTime.end-response.data._queueTime.end
            )
          } catch (err) {
            console.debug(//time
              '[DEBUG][TIMES]',
              'front', response._frontTime,
              'queue', response.data._queueTime,
              'server', response.data._serverTime,
              'gateway', response.data._gatewayTime
            )
          }
        } else {
          console.debug('[DEBUG][RESULT]', response.code, response.data ? (response.data.result || response.data) : response)
        }
  
        if (!response || !response.data || response.data.status === 'error') {
          throw response
        }
  
        window.pushCode({code: response.code})
  
        return response
      }

    } catch (err) {

      if (err.code) {
        window.pushCode({code: err.code, error: true})
      }
      console.error(err)
      printError(err)

      if (err.error) {
        if (err.error.contains("Worker holding Actor was lost")) {
          console.debug('[ERROR] Restoring session')
          await dispatch('resetPromises', { from: 'workspace' });
        }
      }
      return err

    }
  },

  async getPromise({ state, dispatch, commit }, { name, action, payload, kernel, forcePromise, index } ) {

    if (kernel && window && !window.socketPromise) {
      await dispatch('resetPromises', { from: 'optimus' });
      forcePromise = true;
    }

    var promise;

    if (!forcePromise) {
      if (index !== undefined && typeof state[name] == "object") {
        promise = state[name][index];
      } else if (index !== undefined) {
        promise = {}
      } else {
        promise = state[name];
      }
    }

    if (!promise || promise.rejected) {

      promise = dispatch(action, payload);
      promise.fulfilled = false;
      promise.rejected = false;
      promise
        .then(async ()=>{
          promise.fulfilled = true
        })
        .catch(()=>promise.rejected = true);

      if (index !== undefined) {
        var promises = {};
        if (typeof state[name] == "object") {
          promises = {...state[name]};
        }
        promises[index] = promise;
        commit('mutation', { mutate: name, payload: promises });
      } else {
        commit('mutation', { mutate: name, payload: promise });
      }
    }

    return promise;

  },

  async getWorkspace ({ dispatch }, { slug, forcePromise }) {

    var promisePayload = {
      name: 'workspacePromise',
      action: 'loadWorkspace',
      payload: { slug },
      forcePromise
    };

    if (forcePromise) {
      console.warn('Forced workspace loading');
    }

    var workspace = await dispatch('getPromise', promisePayload);

    if ((workspace.slug == slug) || !slug || forcePromise) {
      return workspace;
    }

    console.debug('Forced workspace loading due to slug update', workspace.slug, slug)
    return await dispatch('getPromise', { ...promisePayload, forcePromise: true });

  },

  async loadWorkspace ({commit, dispatch, state}, { slug }) {

    commit('session/mutation', { mutate: 'saveReady', payload: false });
    commit('mutation', { mutate: 'updatingWorkspace', payload: true });

    if (!slug) {
      let workspace = state.workspace
      if (workspace && workspace.slug) {
        slug = workspace.slug;
      } else {
        return false;
      }
    }

    console.log('[WORKSPACE] Loading', slug);

    if (process.env.QUICK_WORKSPACE_CREATION) {
      try {
        await dispatch('request',{
          request: 'post',
          path: '/workspaces',
          payload: { name: slug }
        })
      } catch (err) {}
    }

    let response = await dispatch('request',{
      path: `/workspaces/slug/${slug}`
    });

    let tabs = [];
    let cells = [];

    let tab = -1;
    let customCommands = "{}";

    // console.log('[WORKSPACE] Loaded', slug, response);

    if (response.data) {
      tab = response.data.selectedTab!==undefined ? response.data.selectedTab : tab;
      tabs = response.data.tabs.map(e=>{
        if (e) {
          let profiling = JSON.parse(e.profiling || "{}");
          return {
            name: e.name,
            dataSources: e.dataSources,
            ...profiling
          };
        } else {
          return {
            name: '(new dataset)',
            dataSources: []
          }
        }
      });
      cells = response.data.commands.map( e=>({ ...JSON.parse(e), done: false }) );
      customCommands = response.data.customCommands;
    }

    cells = cells.map(cell => {
      try {

        if (cell && cell.payload && cell.payload.request) {
          cell.payload.request.engine = (state.localEngineParameters || {}).engine || cell.payload.request.engine;
        }
        cell.code = generateCode(cell)[0];
        return cell;
      } catch (err) {
        console.error('Error generating code', err);
        return false
      }
    }).filter(cell => cell);

    let commands = cells.filter(e=>!(e && e.payload && e.payload.request && e.payload.request.isLoad));
    let dataSources = cells.filter(e=>e && e.payload && e.payload.request && e.payload.request.isLoad);

    tabs.forEach((dataset, index) => {
      if (dataset.columns) {
        console.debug('[DATASET] Setting', { dataset, to: index });
        commit('setDataset', { dataset, tab: index });
        if (tab<0) {
          tab = index;
        }
      } else {
        console.debug('[DATASET] Creating', { dataset, to: index });
        commit('newDataset', { dataset, current: true, tab: index });
      }
    })

    if (tab<0) {
      tab = 0;
    }

    let cellsObject = state.cells;

    cellsObject = { ...cellsObject, transformations: commands, dataSources }

    commit('mutation', { mutate: 'cells', payload: cellsObject });
    commit('mutation', { mutate: 'tab', payload: tab});
    commit('mutation', { mutate: 'workspace', payload: response.data });
    commit('session/mutation', { mutate: 'saveReady', payload: true});

    dispatch('customCommands/setAllGenerators', { content: customCommands }, { root: true });

    console.debug('[DEBUG] Loading workspace Done', slug);

    commit('mutation', { mutate: 'updatingWorkspace', payload: false });

    return response.data;

  },

  async loadFeatures ({ state, commit, dispatch, getters }, payload) {

    let { slug, socketPost, isRetry, jupyter_address, ...config } = payload

    let username = await dispatch('session/getUsername');

    console.log('[BUMBLEBEE] Checking features', username, slug);

    let featuresResponse;

    if (isRetry && window.stopClient) {
      await window.stopClient();
    }

    await dispatch('checkSocketPost', socketPost);

    try {
      featuresResponse = await socketPost('features', {
        username,
        workspace: slug || 'default',
        jupyter_address,
        ...config
      }, isRetry ? 60000 : 10000);
    } catch (err) {
      if (!isRetry) {
        return dispatch('loadFeatures', { ...payload, isRetry: err })
      } else {
        throw err;
      }
    }

    let unavailableEngines = [];

    if (!featuresResponse.data.coiled_available) {
      unavailableEngines.push('dask_coiled');
    }

    if (!featuresResponse.data.coiled_gpu_available) {
      unavailableEngines.push('dask_cudf_coiled');
    }

    if (!featuresResponse.data.spark_available) {
      unavailableEngines.push('spark');
    }

    if (!featuresResponse.data.rapids_available) {
      unavailableEngines.push('cudf');
      unavailableEngines.push('dask_cudf');
    }

    commit('mutation', {mutate: 'unavailableEngines', payload: unavailableEngines});

    if (featuresResponse.data.reserved_words) {
      commit('mutation', {mutate: 'reservedWords', payload: JSON.parse(featuresResponse.data.reserved_words)});
    }
    
    if (featuresResponse.data.stop_words_languages) {
      commit('mutation', {mutate: 'stopWordsLanguages', payload: featuresResponse.data.stop_words_languages});
    }

    return { functionsSuggestions: getters.functionsSuggestions, unavailableEngines }
  },

  getFeatures ({dispatch}, payload) {
    var promisePayload = {
      name: 'featuresPromise',
      action: 'loadFeatures',
      kernel: true,
      payload
    };

    return dispatch('getPromise', promisePayload);
  },

  // engine settings

  async loadEngine ({ state, commit, dispatch }, { id, workspaceSlug }) {

    try {
      if (workspaceSlug) {
        var workspace = await dispatch('getWorkspace', { slug: workspaceSlug } );
        id = workspace.configuration;
      }
    } catch (err) {
      console.error(err)
    }

    if (!id && state.engineId) {
      id = state.engineId;
    }

    var enginePayload = undefined

    var path = `/engineconfigurations/preferred`;

    if (id) {
      path = `/engineconfigurations/${id}`;
    }
    try {
      var response = await dispatch('request',{
        path
      });

      id = id || response.data._id;
      var engineConfigName = response.data.name;

      enginePayload = response.data.configuration;

      if (!enginePayload) {
        throw new Error("Engine settings null or undefined: " + engineConfigName);
      }

      commit('mutation', { mutate: 'engineId', payload: id });
      commit('mutation', { mutate: 'engineConfigName', payload: engineConfigName });
      commit('mutation', { mutate: 'localEngineParameters', payload: enginePayload });

    } catch (err) {
      console.warn(`Error requesting engine item ${id} for ${workspaceSlug}. Using default settings.\n${err}`);
    }

    return enginePayload || state.localEngineParameters || {};
  },

  resetEngine ({ commit }, {}) {

    commit('mutation', {mutate: 'engineId', payload: false});
    commit('mutation', { mutate: 'engineConfigName', payload: false });
    commit('mutation', { mutate: 'localEngineParameters', payload: {} });

    return {};
  },

  getEngine ({ dispatch, state }, payload) {

    var promisePayload = {
      name: 'enginePromise',
      action: 'loadEngine',
      payload,
      forcePromise: !state.localEngineParameters
    };

    return dispatch('getPromise', promisePayload);
  },

  // connections

  async loadConnections ({ state, commit, dispatch }, { id, workspaceSlug, include }) {

    try {
      let query = '';
      if (include == 'databases') {
        query = '?filters=isDatabase&values=true';
      } else if (include == 'remotes') {
        query = '?filters=isDatabase&values=false';
      }
      let response = await dispatch('request',{
        path: `/connections${query}`
      });

      commit('mutation', { mutate: 'connections', payload: response.data.items });
      return response.data.items;

    } catch (err) {
      console.error(err);
      return false;
    }
  },

  getConnections ({ dispatch, state }, payload) {

    var promisePayload = {
      name: 'connectionsPromise',
      action: 'loadConnections',
      payload,
      forcePromise: !state.connections || payload.forcePromise
    };

    return dispatch('getPromise', promisePayload);
  },

  async updateConnectionsItems ({ dispatch, getters }, payload) {
    await dispatch('getConnections', payload);
  },

  async afterWholeProfiling ({ state, commit, dispatch }, {error = false} = {} ) {
    commit('mutation', {mutate: 'updatingWholeProfile', payload: false });
    await dispatch('runAfterProfileCallback', {error, type: 'final'});
  },

  async afterPreviewProfiling ({ state, commit, dispatch }, {error = false} = {} ) {
    commit('mutation', {mutate: 'updatingPreviewProfile', payload: false });
    await dispatch('runAfterProfileCallback', {error, type: 'preview'});
  },

  // events

  async afterPreliminaryProfiling ({state, commit, dispatch}) {
    await dispatch('runAfterProfileCallback', {type: 'preliminary'});
  },
  
  async runAfterProfileCallback ({state, commit}, {error = false, type = false} = {}) {
    let result = true;
    if (state.afterProfileCallback && typeof state.afterProfileCallback === 'function') {
      result = await state.afterProfileCallback(type, error);
    }
    if (result || result === undefined) {
      commit('mutation', { mutate: 'afterProfileCallback', payload: false });
    }
  },

  afterNewResults ({ commit }, payload) {
    commit('mutation', { mutate: 'gettingNewResults', payload: '' });
    commit('previewDefault');
  },

  async afterProfiling ({ commit, dispatch }, payload) {
    commit('previewDefault', { names: ['PreviewNames'] });
    await dispatch('runAfterProfileCallback');
  },

  // cells

  codeText ({ getters }, { newOnly, ignoreFrom }) {
    newOnly = newOnly || false;
    ignoreFrom = ignoreFrom || -1;
    if (!getters.cells.length) {
      return '';
    }
    return filterCells(getters.cells, newOnly, ignoreFrom).map(e=>e.code).join('\n').trim();
  },

  codeCommands ({ getters }, { newOnly, ignoreFrom }) {
    newOnly = newOnly || false;
    ignoreFrom = ignoreFrom || -1;
    if (!getters.cells.length) {
      return [];
    }
    return filterCells(getters.cells, newOnly, ignoreFrom).map(e=>({
      command: e.command,
      payload: e.payload
    }));
  },

  async finalCommands ({ dispatch, state }, { ignoreFrom, include, noPandas }) {

    var finalPayload = deepCopy(await dispatch('codeCommands', { newOnly: false, ignoreFrom }));

    finalPayload = finalPayload.map(command=>{
      command.payload.request = command.payload.request || {};
      command.payload.request.type = 'final';
      return command;
    });

    // console.debug('[SPECIAL PROCESSING] finalPayload (complete)', finalPayload);

    include = include || [];

    include.forEach((payload)=>{
      finalPayload.push(payload);
    });

    if (!noPandas && ['spark', 'ibis'].includes(state.localEngineParameters.engine)) {

      var dfNames = [ ...new Set(finalPayload.filter(({payload})=>payload.request.createsNew).map(({payload})=>payload.newDfName)) ];

      // console.debug('[SPECIAL PROCESSING] dfNames', dfNames)

      dfNames.forEach(dfName => {
        finalPayload.push({
          command: 'toPandas',
          payload: {
            dfName,
            request: {
              saveTo: dfName
            }
          }
        })
      });

    }


    return finalPayload;

  },

  // marks or deletes operation cells
  async markCells ({ dispatch, state, commit, getters }, { mark, ignoreFrom, error, splice, last }) {

    mark = mark===undefined ? true : mark;
    ignoreFrom = ignoreFrom || -1;

    let cells = getters.cells;

    if (last) {
      last = cells.map(c => c.modified).reduce((a, b) => (a > b ? a : b), -1);
    }

    for (let i = cells.length - 1; i >= 0 ; i--) {
      if (ignoreFrom>=0 && i>=ignoreFrom) {
        continue
      }
      if (last && cells[i].modified!=last) {
        continue
      }
      if (splice) {
        if (!cells[i] || (!cells[i].done && cells[i].code)) {
          cells.splice(i,1)
        }
      } else {
        cells[i] = { ...cells[i] }
        if (error) {
          if (cells[i].code) {
            cells[i].error = true
          }
          cells[i].done = false
        } else {
          if (cells[i].code) {
            cells[i].done = mark
          }
          cells[i].error = false
        }
      }
    }

    commit('setCells', cells);

    if (mark && !(error || splice)) {
      let newCodeDone = '';
      if (mark && state.cells.transformations) {
        newCodeDone = await dispatch('codeText', { newOnly: false, ignoreFrom });
      }
      commit('mutation', { mutate: 'codeDone', payload: newCodeDone });
    } else if (!mark) {
      commit('mutation', { mutate: 'codeDone', payload: '' });
    }

  },

  async undoCells ({state, commit, dispatch}, forceDelete) {
    if ((!state.lastCorrectCells.dataSources.length && !state.lastCorrectCells.transformations.length) || forceDelete) {
      if (!forceDelete) {
        console.warn('No previous state found, deleting defective cells instead.');
      }
      await dispatch('deleteErrorCells');
    } else {
      commit('mutation', {mutate: 'cells', payload: deepCopy(state.lastCorrectCells)});
      commit('mutation', {mutate: 'lastCorrectCells', payload: deepCopy(defaultState.lastCorrectCells)});
    }
  },

  deleteErrorCells ({ commit, getters }) {
    let cells = getters.cells;
    for (let i = cells.length - 1; i >= 0 ; i--) {
      if (cells[i] && cells[i].error && cells[i].code) {
        cells.splice(i,1);
      }
    }
    commit('setCells', cells);
  },

  async beforeRunCells ( { state, commit, getters }, { newOnly, ignoreFrom, methods } ) {

    newOnly = newOnly || false;
    ignoreFrom = ignoreFrom || -1;

    let cells = getters.cells;

    let filteredCells = filterCells(cells, newOnly, ignoreFrom);

    for (let i = 0; i < filteredCells.length; i++) {
      const cell = filteredCells[i];
      if (!cell?.payload) {
        // commit('deleteCell', { id: cell.id, cell });
        continue;
      }
      if (window.getCommandHandler) {
        var commandHandler = window.getCommandHandler(cell)
        if (commandHandler && commandHandler.beforeRunCells) {
          cell = {...cell}; // avoid direct vuex mutation
          cell.payload = await commandHandler.beforeRunCells(cell.payload, methods);
          cell.modified = new Date();
          commit('updateCell', { id: cell.id, cell });
        } else if (!commandHandler) {
          console.warn('[COMMANDS] commandHandler not found for', cell);
        }
      } else {
        console.warn('[COMMANDS] getCommandHandler not defined');
      }

    }
  },
  async afterRunCells ({commit}) {
    commit('copyCellsIfOk');
    return true;
  },

  async resetPromises ({ commit, dispatch }, { from, error }) {
    from = from || 'cells';
    error = error == undefined ? true : false;

    console.debug('[RESET] From', from);

    switch (from) {
      case 'workspace':
        commit('session/mutation', { mutate: 'workspaceStatus', payload: 'loading' })
        commit('session/mutation', { mutate: 'saveReady', payload: false});
        commit('mutation', { mutate: 'workspacePromise', payload: false});
        commit('mutation', { mutate: 'workspace', payload: false });
      case 'config':
        commit('mutation', { mutate: 'enginePromise', payload: false});
        commit('mutation', { mutate: 'localEngineParameters', payload: ''});
      case 'optimus':
        commit('mutation', { mutate: 'optimusPromise', payload: false});
        commit('mutation', { mutate: 'dashboardLink', payload: ''});
      case 'cells':
        await dispatch('markCells', { mark: false });
        commit('mutation', { mutate: 'codeDone', payload: '' });
        if (error) {
          commit('mutation', { mutate: 'errorAlerts', payload: [] });
          commit('mutation', { mutate: 'lastWrongCode', payload: false });
        }
        commit('mutation', { mutate: 'cellsPromise', payload: false });
      case 'executions':
        commit('mutation', { mutate: 'executePromises', payload: {} });
      default:
        commit('mutation', { mutate: 'profilingsPromises', payload: {} });
    }
  },

  async loadOptimus ({commit, state, dispatch, getters}, { slug, socketPost }) {

    await Vue.nextTick();

    let engineParams = await dispatch('getEngine', { workspaceSlug: slug });

    if (!slug) {
      slug = state.workspaceSlug;
    } else if (slug) {
      commit('mutation', { mutate: 'workspaceSlug', payload: slug })
    }

    let username = await dispatch('session/getUsername');

    console.log('[BUMBLEBEE] Initializing Optimus', username, slug, engineParams);

    await dispatch('checkSocketPost', socketPost);

    let response = await socketPost('initialize', {
      username,
      workspace: slug || 'default',
      ...engineParams
    });

    console.debug('[DEBUG][INITIALIZATION] optimus response', response);

    if (response.data.dashboard_link) {
      console.log('%c[DEBUG] Dashboard: ' + response.data.dashboard_link, 'color: green;');
      commit('mutation', { mutate: 'dashboardLink', payload: response.data.dashboard_link });
    }

    if (response.data.client_install) {
      let installs = Object.values(response.data.client_install);
      if (!installs.length || installs.some(e=>!e)) {
        console.warn('Optimus installation on workers unknown');
      }
    }

    if (response.data.coiled_available) {
      commit('mutation', {mutate: 'coiledAvailable', payload: true});
    }

    if (!response.data.optimus) {
      throw response;
    }

    window.pushCode({ code: response.code });

    return response.data;
  },

  getOptimus ({dispatch}, payload) {
    var promisePayload = {
      name: 'optimusPromise',
      action: 'loadOptimus',
      kernel: true,
      payload
    };

    return dispatch('getPromise', promisePayload);
  },

  async loadCellsResult ({dispatch, state, getters, commit}, { forceAll = false, ignoreFrom = -1, socketPost, clearPrevious = true, beforeRunCells, methods } = {}) {

    console.debug('[DEBUG] Loading cells result');

    let newOnly;

    commit('mutation', { mutate: 'updatingWorkspace', payload: false });
    
    try {

      // prerequisites

      await dispatch('checkSocketPost', socketPost);
      var optimus = await dispatch('getOptimus', { payload: { socketPost }} );
      let generators = await dispatch('customCommands/setAllGenerators', { socketPost }, { root: true });
      var init = [optimus, generators];

      let firstPendingOperation = 0;

      if (forceAll) {
        await dispatch('markCells', { mark: false, ignoreFrom: -1 });
      } else {
        firstPendingOperation = getters.cells.findIndex(operation => !operation.done);
      }

      if (ignoreFrom >= 0) {

        if (ignoreFrom < firstPendingOperation) {
          forceAll = true;
          await dispatch('markCells', { mark: false, ignoreFrom: -1 });
          firstPendingOperation = 0;
        } else {
          await dispatch('markCells', { mark: false, ignoreFrom });
        }
      }

      let toRunOperations = getters.cells

      if (ignoreFrom>=0) {
        toRunOperations = toRunOperations.filter((operation, index) => index < ignoreFrom);
      }

      toRunOperations = toRunOperations.filter((operation, index) => index >= firstPendingOperation);

      newOnly = !forceAll;

      // tries all the code so it can check if there's any changes in previous cells

      var code = await dispatch('codeText', { newOnly, ignoreFrom });
      var codePayload = await dispatch('codeCommands', { newOnly, ignoreFrom });

      var codeDone = forceAll ? '' : state.codeDone.trim();

      var rerun = false;

      var wrongCode = (state.lastWrongCode ? state.lastWrongCode.code : undefined) || ''

      if (code==='') {
        console.debug('%c[CODE MANAGER] Trying to run an empty string as code', 'color: yellow;');
        return false;
      }

      if (code === codeDone) {
        console.debug('%c[CODE MANAGER] Nothing new to run', 'color: yellow;');
        return false;
      }
      else if (
        ( !state.firstRun && (forceAll || code.indexOf(codeDone)!=0 || codeDone=='' || wrongCode) )
        ||
        !window.socketAvailable
      ) {
        rerun = true;
      }
      else if (!forceAll) {
        code = await dispatch('codeText', { newOnly, ignoreFrom });
        codePayload = await dispatch('codeCommands', { newOnly, ignoreFrom });
      }

      if (wrongCode && code===wrongCode ) {
        console.debug('%c[CODE MANAGER] Cells went wrong last time. '+state.lastWrongCode.error, 'color: yellow;');
        throw state.lastWrongCode.error;
      }

      if (rerun) {
        // console.log('[CODE MANAGER] every cell is new')
        await dispatch('markCells', { mark: false, ignoreFrom });
      }

      if (state.firstRun) {
        rerun = false;
      }

      commit('mutation', { mutate: 'commandsDisabled', payload: true });

      if (clearPrevious && !state.firstRun) {
        await dispatch('resetPromises', { from: 'executions' });
      }

      commit('mutation', { mutate: 'updatingWorkspace', payload: true });

      if (beforeRunCells) {
        await dispatch('beforeRunCells', { newOnly, ignoreFrom, methods });
      }

      var response;

      if (codePayload) {

        if (!Array.isArray(codePayload)) {
          codePayload = [codePayload];
        }

        // avoids saving new files when previewing a previous point on the notebook

        if (ignoreFrom>=0) {
          codePayload = codePayload.filter(({payload})=>!(payload?.request?.isSave))
        }

        // checks if there's any cell that asks to process again everything using the original engine

        var getFinal = codePayload.some(({payload})=>(payload?.request?.isSave && payload._engineProcessing))

        // console.debug('[SPECIAL PROCESSING] getFinal', getFinal);

        if (getFinal) {

          codePayload = await dispatch('finalCommands', { ignoreFrom, include: [] });

          console.debug('[SPECIAL PROCESSING] codePayload (with toPandas)', codePayload);

        } else {

          console.debug('[SPECIAL PROCESSING] codePayload', codePayload);

        };

        codePayload = codePayload.map((command)=>{
          command = deepCopy(command)
          var _custom = command.payload._custom;
          if (_custom && typeof _custom === 'function' ) {
            return _custom(command.payload);
          }
          if (command.payload && typeof command.payload === 'object') {
            Object.keys(command.payload).forEach(key => {
              if (key.startsWith("__")) {
                command.payload[key] = undefined;
              }
            });
          }
          return command;
        });

        response = await socketPost('run', {
          code: undefined,
          codePayload,
          category: 'operation',
          username: await dispatch('session/getUsername'),
          workspace: state.workspaceSlug || 'default',
          key: state.key
        });

      } else {

        response = await socketPost('run', {
          code,
          codePayload: undefined,
          category: 'operation',
          username: await dispatch('session/getUsername'),
          workspace: state.workspaceSlug || 'default',
          key: state.key
        });

      }

      // await dispatch('markCells', { mark: true, ignoreFrom }); // this should be done after the profiling

      response.originalCode = code;

      console.debug('[DEBUG][CODE]', response.code);
      window.pushCode({code: response.code})

      commit('mutation', { mutate: 'updatingWorkspace', payload: false });
      commit('mutation', { mutate: 'commandsDisabled', payload: false });

      if (!response || !response.data || !response.data.result || response.data.status == "error") {
        throw response
      }

      await dispatch('afterRunCells', { newOnly, ignoreFrom, socketPost, methods });

      console.debug('[DEBUG] Loading cells result Done');
      return response

    } catch (err) {

      err = err || new Error("Unknown error")

      commit('mutation', {mutate: 'updatingWorkspace', payload: false });
      await dispatch('resetPromises', { from: 'cells' });

      if (err.code && window.pushCode) {
        window.pushCode({code, error: true});
      }
      commit('appendError', { error: printError(err), cells: true });

      var wrongCode = await dispatch('codeText', { newOnly, ignoreFrom });
      commit('mutation', { mutate: 'lastWrongCode', payload: { code: wrongCode, error: deepCopy(err) }});

      if (state.firstRun || ignoreFrom < 0) {
        await dispatch('markCells', { ignoreFrom, error: true, last: true });
      }
      commit('mutation', { mutate: 'commandsDisabled', payload: undefined });

      err.bumblebeeType = '(Error on cells)';
      console.debug('[DEBUG] Loading cells result Error');
      throw err;

    }

  },

  getCellsResult ({dispatch}, { forcePromise, payload }) {

    var promisePayload = {
      name: 'cellsPromise',
      action: 'loadCellsResult',
      payload,
      kernel: true,
      forcePromise
    };

    return dispatch('getPromise', promisePayload);
  },

  async requestPreliminaryProfiling ({ dispatch }, { dfName, socketPost }) {
    let codePayload = {
      dfName,
      command: 'preliminary_profile'
    };

    let response = await dispatch('evalCode', { codePayload, category: 'profiling', socketPost });

    if (!response || !response.data || !response.data.result || response.data.status == "error") {
      throw response;
    }

    window.pushCode({code: response.code});
    return parseResponse(response.data.result);
  },

  async setProfiling ({ dispatch, state, getters, commit }, { dfName, dataset, avoidReload, partial }) {

    dataset.dfName = dfName;
    await dispatch('setDataset', { dataset, avoidReload: avoidReload || partial || partial===0, partial: partial || partial===0 });

    if (state.gettingNewResults) {
      await dispatch('afterProfiling');
    }

    commit('kernel', 'done');

    return dataset;
  },

  async loadProfiling ({ dispatch, state, getters, commit }, { dfName, socketPost, ignoreFrom, avoidReload, clearPrevious, methods }) {
    console.debug('[DEBUG] Loading profiling', dfName);
    try {

      commit('mutation', {mutate: 'updatingProfile', payload: true });

      await Vue.nextTick();

      var executeResult = await dispatch('getExecute', { dfName, socketPost, ignoreFrom, methods });

      var username = await dispatch('session/getUsername');

      if (!dfName) {
        dfName = getters.currentDataset.dfName;
        if (!dfName) {
          console.warn('[DATA LOADING] No workspaces found');
          return {};
        }
      }

      let profile;
      let dataset;

      dataset = await dispatch('requestPreliminaryProfiling', { dfName, socketPost });

      let found = state.datasets.findIndex(_d => _d.dfName == dfName);

      if (clearPrevious && found>=0) {
        let foundDataset = deepCopy(state.datasets[found])
        foundDataset.columns = [];
        foundDataset._columns = {};
        await dispatch('setDataset', { dataset: foundDataset, avoidReload: true });
      }
      
      profile = await dispatch('setProfiling', { dfName, dataset, avoidReload: true });

      dispatch('afterPreliminaryProfiling');

      if ( (clearPrevious || avoidReload) && found >= 0 ) {
        commit('updateDataset', { tab: found } );
      }

      commit('mutation', {mutate: 'updatingProfile', payload: false });

      let columnsCount = profile.summary.cols_count;
      
      return {profile, dfName, columnsCount, avoidReload};

    } catch (err) {

      err = err || new Error("Unknown error")

      if (err.code && window.pushCode) {
        window.pushCode({code: err.code, error: true});
      }
      commit('appendError', { error: printError(err), cells: ignoreFrom < 0 });

      var wrongCode = await dispatch('codeText', { newOnly: true, ignoreFrom });
      commit('mutation', { mutate: 'lastWrongCode', payload: { code: wrongCode, error: deepCopy(err) } });

      if (state.firstRun || ignoreFrom < 0) {
        await dispatch('markCells', { ignoreFrom, error: true, last: true });
      }
      commit('mutation', { mutate: 'commandsDisabled', payload: undefined});

      err.bumblebeeType = '(Error on profiling)'
      console.debug('[DEBUG] Loading profiling Error', dfName);

      commit('mutation', {mutate: 'updatingProfile', payload: false });

      throw err;
    }
  },

  getProfiling ({dispatch}, { forcePromise, payload }) {
    var promisePayload = {
      name: 'profilingsPromises',
      action: 'loadProfiling',
      payload,
      kernel: true,
      index: payload.dfName,
      forcePromise
    };

    return dispatch('getPromise', promisePayload);
  },

  async loadExecute ({ dispatch, commit, getters }, { dfName, socketPost, ignoreFrom, methods }) {

    // console.debug('[DEBUG] Executing dataset', dfName);

    if (!dfName) {
      throw new Error('Trying to execute undefined Dataframe');
    }

    await Vue.nextTick();

    var cellsResult = await dispatch('getCellsResult', { payload: { socketPost, ignoreFrom, methods }});

    var datasets = getters.secondaryDatasets;

    var response = await dispatch('evalCode', { socketPost, codePayload: { command: 'execute', dfName }, category: 'requirement'});

    if (!response || !response.data || response.data.status === "error") {
      console.warn('[DEBUG] Execute unsuccessful', dfName);
      return false
    }

    console.debug('[DEBUG] Executed', dfName);

    return true;

  },

  getExecute ({state, dispatch}, { dfName, socketPost, ignoreFrom, forcePromise, methods }) {
    var promisePayload = {
      name: 'executePromises',
      action: 'loadExecute',
      payload: { dfName, socketPost, ignoreFrom, methods },
      kernel: true,
      index: dfName,
      forcePromise
    };

    return dispatch('getPromise', promisePayload);
  },

  async getBufferWindow ({commit, dispatch, state, getters}, {from, to, slug, dfName, socketPost, beforeCodeEval, methods}) {

    slug = slug || state.workspaceSlug;

    var workspaceLoad = await dispatch('getWorkspace', { slug } );

    var tabs = workspaceLoad.tabs;

    if (!tabs.length) {
      tabs = state.datasets;
    }

    if (!tabs.length) {
      console.warn('[DATA LOADING] Requested window for not existing df');
      return false;
    }

    dfName = dfName || tabs[0].dfName;

    from = from || 0;

    to = to || 35; // TO-DO: 35 -> ?

    var previewCode = '';
    var codePayload  = { command: undefined };
    var noBufferWindow = false;
    var lessRows = false;
    var forceName = false;

    if (state.previewCode) {
      previewCode = state.previewCode.code;
      codePayload = state.previewCode.codePayload;
      noBufferWindow = state.previewCode.noBufferWindow;
      lessRows = state.previewCode.lessRows;
      forceName = !!state.previewCode.datasetPreview;
    }

    var referenceCode = await getPropertyAsync(previewCode) || ''

    var currentDataset = getters.currentDataset;

    if (!currentDataset && !dfName) {
      throw new Error('No dataset found');
    }

    var datasetDfName = currentDataset.dfName || dfName;

    let executeResult = await dispatch('getExecute', { dfName: datasetDfName, socketPost, methods });

    if (beforeCodeEval) {
      beforeCodeEval();
    }

    var response;

    // profiled preview

    var firstRequest = !state.profilePreview?.done;
    var profilePreview = state.profilePreview?.done || state.profilePreview?.payload?.preview?.latePreview;

    if (profilePreview) {
      try {
        var codePayload = {
          request: {
            type: 'preview',
            dfName: 'preview_df',
            sample: true,
            window: [from, to+1],
            noBufferWindow,
            lessRows
          }
        };
        response = await dispatch('evalCode',{ socketPost, codePayload, category: 'preview_sample' });
        if (!response || !response.data || response.data.status == "error") {
          throw response;
        }
      } catch (err) {
        console.error(err,'Retrying without dataframe from cache');
        profilePreview = false;
      }
    }

    // not profiled preview or empty

    if (!profilePreview) {
      var window = [from, to+1];
      var codePayload = {
        ...codePayload,
        request: {
          ...codePayload.request,
          type: 'preview',
          dfName: datasetDfName,
          sample: true,
          window,
          noBufferWindow,
          lessRows,
          noSave: true
        }
      };
      response = await dispatch('evalCode',{ socketPost, codePayload, category: 'preview_sample' })
    }

    if (firstRequest && !profilePreview && !codePayload.command) {
      let colNames = response.data.result?.columns?.map(col=>col.title);
      commit('setColumns', { dfName: datasetDfName, columns: colNames });
    }

    var sample = response.data.result;

    if (response.data.status === 'error') {
      if (state.previewCode) {
        commit('setPreviewInfo', {error: response.data.error})
      } else {
        await dispatch('markCells', { error: true, last: true });
      }
    } else if (sample.value.length) {
      commit('setPreviewInfo', {error: false})
    }


    commit('kernel', 'done');

    if (sample && sample.columns && sample.columns.map) {
      var pre = forceName ? '__preview__' : ''
      sample.columns = sample.columns.map(e=>({...e, title: pre+e.title}))
      return {
        code: referenceCode,
        update: getters.currentDatasetUpdate,
        from,
        to,
        sample: sample,
        inTable: false
      }
    } else {
      return false;
    }

  },

  async changeTab ({commit}, value) {
    commit('mutation', { mutate: 'tab', payload: value });
    commit('mutation', { mutate: 'updatingProfile', payload: false });
    commit('mutation', { mutate: 'updatingWholeProfile', payload: false });
    commit('mutation', { mutate: 'updatingPreviewProfile', payload: false });
  },

  async mutateAndSave ({dispatch, commit}, { mutate, payload }) {
    commit('mutation', { mutate: mutate, payload })
    await dispatch('session/saveWorkspace')
  },

  async newDataset ({ dispatch, commit }, payload) {
    commit('newDataset', payload || {})
    await dispatch('session/saveWorkspace')
  },

  async setDataset ({ dispatch, commit }, payload) {
    commit('setDataset', payload)
    await dispatch('session/saveWorkspace')
  },

  async deleteTab ({ dispatch, commit }, index) {
    commit('deleteTab', index)
    await dispatch('session/saveWorkspace')
    return index
  },

  async request ({state, dispatch}, {request, path, payload, accessToken}) {

    if (!request) request = 'get'
    if (!accessToken) accessToken = state.session.accessToken

    var response

    try {
      if (['post','put'].includes(request)) {
        response = await this.$axios[request](path, payload, { headers: {'Authorization': accessToken} } );
      } else {
        response = await this.$axios[request](path, { headers: {'Authorization': accessToken} } );
      }
    } catch (err) {
      if (err && err.response && err.response.status===401) {
        await dispatch('session/signOut');
      }
      throw err;
    }

    return response;

  },
}

var pGetters = {}

properties.forEach((p)=>{
  if (p.multiple) {
    pGetters['current'+p.name] = function(state) {
      return state['every'+p.name][state.tab]
      || (p.defaultC ? p.defaultC() : (p.defaultV || false))
    }
  } else {
    pGetters[p.name] = function(state) {
      return state[p.name]
      || (p.defaultC ? p.defaultC() : (p.defaultV || false))
    }
  }
})

export const getters = {
  loadingStatus (state) {
    if (state.updatingWorkspace) {
      return "Updating workspace";
    } else if (state.updatingPreview || state.updatingPreviewProfile) {
      return "Updating preview";
    } else if (state.updatingProfile || state.updatingWholeProfile) {
      return "Updating profile";
    } else if (state.updatingDataset) {
      return "Updating dataset";
    } else {
      return false
    }    
  },
  currentDataset (state) {
    return state.datasets[state.tab];
  },
  transformations (state) {
    return state.cells.transformations || [];
  },
  dataSources (state) {
    return state.cells.dataSources || [];
  },
  loadPreview (state) {
    return state.loadPreview;
  },
  secondaryDatasets (state, getters) {
    var datasetsArray = getters.cells
    .filter(cell => {
      return cell?.payload?.request?.createsNew;
    }).map(cell => {
      return cell && cell.payload && cell.payload.newDfName
    })
    return datasetsArray
  },
  hasSecondaryDatasets (state, getters) {
    return Object.keys(getters.secondaryDatasets || {})
        .filter(e=>!e.startsWith('_')).length>1
  },
  currentSelection (state) {
    return state.datasetSelection[state.tab] || {}
  },
  ...pGetters,
  currentListView (state) {
    return state.listViews[state.tab] || false
  },

  cells (state) {
    return [...state.cells.dataSources || [], ...state.cells.transformations || []];
  },

  usingPandasTransformation (state) {
    return INCOMPATIBLE_ENGINES.includes((state.localEngineParameters || {}).engine);
  },

  usingSample (state, getters) {
    let dfName = (getters.currentDataset || {}).dfName
    return state.sampledDatasets[dfName];
  },

  usingPreview (state, getters) {
    return getters.usingPandasTransformation || getters.usingSample;
  },

  canCompileSQL (state) {
    return (state.localEngineParameters || {}).engine !== 'ibis';
  },

  selectionType (state) {
    var _ds = state.datasetSelection[state.tab] || []
    if (_ds && _ds.ranged &&  _ds.ranged.values && _ds.ranged.values.length) {
      return 'values'
    }
    if (_ds && _ds.ranged && _ds.ranged.ranges && _ds.ranged.ranges.length) {
      return 'ranges'
    }
    if (_ds && _ds.text && _ds.text.value) {
      return 'text'
    }
    return 'columns'
  },
  appError (state) {
    return state.appStatus.error ? state.appStatus.error.message : false
  },
  typesAvailable (state) {
    try {
      return [...new Set(state.datasets[state.tab].columns.map(col=>col.stats.inferred_data_type.data_type))] || state.allTypes
      // return state.datasets[state.tab].summary.data_types_list || state.allTypes
    } catch (error) {
      return state.allTypes
    }
  },

  currentRowHighlights (state) {
    try {
      return state.everyPreviewInfo[state.tab].rowHighlights
    } catch (err) {
      return false
    }
  },

  functionsSuggestions (state) {

    if (!state?.reservedWords?.functions) {
      return [];
    }

    let suggestions = [];
    
    Object.entries(state.reservedWords.functions).forEach(([key, value])=>{
      let params = [{
        type: 'column',
        name: 'column',
        description: "A column's name",
        required: true // TO-DO: required on function
      }];
      let description = value;
      let example = `${key}(column)`;
      if (typeof value !== "string") {
        if ('params' in value) {
          params = value.params.map(param=>{
            param.type = [param.type].flat();
            if (param.type.includes('column')) {
              param.type = 'column';
            } else {
              param.type = param.type[0];
            }
            if (param.name==='col_name') {
              param.name = 'column';
              param.description = param.description || "A column's name";
            }
            return param;
          });
        }
        if ('description' in value) {
          description = value.description;
        }
        if ('example' in value) {
          example = value.example;
        }
      }
      suggestions.push({type: 'function', text: key, params, description, example });
    })

    return suggestions;
  }
}
