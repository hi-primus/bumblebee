# Which engine to use
Bumblebee support many engines with has specific features that can help you to process your data faster. 
Below is a table of features available in every engine, and a list of steps to select the engine that can help to process your data easily.

| Engine        | Out-of-Core   | Cluster Support   | CPU/GPU       |
| -----------   | -----------   | -----------       | -----------   |
| Pandas        | No            | No                | CPU           |
| Dask          | Yes           | Yes               | CPU           |
| cuDF          | No            | No                | GPU           |
| Dask-cuDF     | Yes           | Yes               | GPU           |
| Spark         | No            | Yes               | CPU/GPU       |
| Vaex          | Yes           | No                | CPU           |
| Ibis          | Yes           | No                | CPU           |


Follow this steps to select the engine:  
* Use pandas if your data fit comfortably in your local memory.
* Use cuDF if you have a GPU compatible with RAPIDS, and your data fits in memory.
* Use Vaex if your data do not fit in memory.
* Use a Dask/Dask-cuDF/Spark Cluster if you have one available.
* Use a service like Coiled to get a Dask/Dask-cuDF cluster on demand and pay for what you use.



