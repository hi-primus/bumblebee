<script lang="ts">
  import { BlurrClient } from 'blurr';
  import type { Client, Source } from 'blurr';
  import { throttle, optimizeRanges } from '$lib/utils';
  import { onMount } from 'svelte';
  import Column from './Column.svelte';
  import Cell from './Cell.svelte';
  import { browser } from '$app/environment';

  let client: Client;

  onMount(async () => {
    client = BlurrClient({
      serverOptions: {
        scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js'
      }
    });
    const result = await client.run('1+1');
    console.log(`Python says that 1 + 1 = ${result} (Pyodide is initialized)`);

    window.run = async (code: string) => {
      let result = await client.run(code);
      if (typeof result?.toJs === 'function') {
        try {
          let _result = result.toJs({ dict_converter: Object.fromEntries });
          result = _result;
        } catch (err) {
          console.error(err);
        }
      }
      console.log(code, '\n', result);
      return result;
    };
  });

  let table: any;

  let files: FileList;
  let target: string = 'df';

  let df: Source;
  let columns: string[];
  let dfLength: number;

  interface Chunk {
    start: number;
    stop: number;
    data: Record<string, any>[];
  }
  let chunks: Chunk[] = [];

  $: rowsList = chunks.reduce((prev: Record<string, any>[], current: Chunk) => {
    current.data.forEach((row, i) => {
      prev[current.start + i] = row;
    });
    return prev;
  }, []);

  async function loadDataframe() {
    if (!files || !target) {
      return;
    }
    for (const file of files) {
      df = await client.readCsv({ file });
      columns = await df.columns();
      dfLength = await df.count();
      rowsList = new Array(dfLength);
      console.log('(Table demo)', { dfLength, rowsList });
      getChunk();
    }
  }

  async function getChunk(from: number = 0, length: number = 40) {
    if (from >= dfLength) return;
    from = Math.max(from, 0);
    let to = Math.min(from + length, dfLength);
    let prevChunkRanges = chunks.map((item) => {
      return [item.start, item.stop];
    });
    let newRanges = optimizeRanges([from, to], prevChunkRanges);

    for (let i = 0; i < newRanges.length; i++) {
      const [start, stop] = newRanges[i];
      let data = await df.columnsSample({ start, stop });
      let chunk = {
        start,
        stop,
        data
      };
      chunks.push(chunk);
    }
    chunks = chunks.splice(-7);
  }

  function parseScroll(top: number) {
    let cellId = Math.floor(top / 20);
    getChunk(cellId);
    getChunk(cellId + 40);
    getChunk(cellId - 40);
  }

  let throttleParseScroll = throttle(function (start: number) {
    parseScroll(start);
  }, 100);
</script>

<svelte:head>
  <title>Blurr Test</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

<h1>Blurr demo</h1>
<p>Input a file</p>
<form on:submit|preventDefault={loadDataframe}>
  <input type="file" name="Dataset file" id="dataset_file" bind:files />
  <br />
  <button disabled={!files} type="submit"> Load dataframe </button>
</form>

<p>
  Columns: {columns}
</p>

<div
  class="table-container"
  bind:this={table}
  on:scroll={() => throttleParseScroll(table.scrollTop)}
>
  <div class="table" style="height: {dfLength * 20 + 50}px">
    {#if columns}
      {#each columns as column}
        <Column title={column}>
          {#each rowsList as row, i}
            <Cell cellId={i}>
              {(row && row[column]) || ''}
            </Cell>
          {/each}
        </Column>
      {/each}
    {/if}
  </div>
</div>

<style lang="scss">
  .table-container {
    background-color: #ffffff;
    padding: 1rem;
    max-height: calc(100vh - 4rem);
    border-radius: 0.25rem;
    overflow-y: scroll;
    .table {
      display: flex;
    }
  }
</style>
