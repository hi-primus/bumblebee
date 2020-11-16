cd
pip install --upgrade --no-deps --force-reinstall git+https://github.com/ironmussa/Optimus.git@optimus_dataframe
pip3 install --upgrade --no-deps --force-reinstall git+https://github.com/ironmussa/Optimus.git@optimus_dataframe
jupyter kernelgateway --ip=0.0.0.0 --JupyterWebsocketPersonality.list_kernels=True --KernelGatewayApp.allow_origin='*'
