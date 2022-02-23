use_prefect = True

try:
    from prefect import flow, task
except:
    use_prefect = False

if use_prefect:
    import asyncio
    import nest_asyncio
    nest_asyncio.apply()

    async def _run_flow_on_jupyter(_flow: prefect.flows.Flow, *args, **kwargs):
        result = None
        try:
            result = _flow(*args, **kwargs)
            await result
        except TypeError as e:
            if "can't be used in 'await' expression" in str(e):
                return result
        
    def run_flow_on_jupyter(flow: prefect.flows.Flow, *args, **kwargs):
        return asyncio.run(_run_flow_on_jupyter(flow, *args, **kwargs))

    def prefect_result(state):
        if hasattr(state, "wait"):
            return run_flow_on_jupyter(state.wait).result()
        else:
            return state