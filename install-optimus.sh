cd
pip install --upgrade --force-reinstall git+https://github.com/ironmussa/Optimus.git@develop-3.0
pip3 install --upgrade --force-reinstall git+https://github.com/ironmussa/Optimus.git@develop-3.0
jupyter kernelgateway --ip=0.0.0.0 --JupyterWebsocketPersonality.list_kernels=True --KernelGatewayApp.allow_origin='*'
