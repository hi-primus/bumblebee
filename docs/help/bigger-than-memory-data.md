# Bigger than memory data

In some scenarios the data you want to load could be bigger that your system or cluster memory which could cause slowdown or crash the system depending on the engine you are select.
 
To handle this we recommend:

1. Just select the number of rows you want to load when previewing the file in Bumblebee. When saving your processed data you can decide if to process the whole dataset.
2. Use Vaex as Bumblebee Engine. It can handle greater than memory data processing. 
3. If you have access to Dask/Dask-cuDF cluster use it. If your data is smaller than the total cluster memory it can slow thing down.
4. Use an external service like Coiled to load as much data as you need. With Coiled you can get a Dask/Dask-cuDF cluster on demand and pay for what you use.

I raise and issue about automatically load as much data as possible depending on the memory available.
You can see it here.

Please let me know if you have another question.