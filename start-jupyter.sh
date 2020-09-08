
cd
pip install --upgrade --force-reinstall --no-deps git+https://github.com/ironmussa/Optimus.git@develop-3.0
pip3 install --upgrade --force-reinstall --no-deps git+https://github.com/ironmussa/Optimus.git@develop-3.0
if [ -z "$address" || "$localhost" = false ]
then
  jupyter kernelgateway --JupyterWebsocketPersonality.list_kernels=True
else
  jupyter kernelgateway --ip=0.0.0.0 --JupyterWebsocketPersonality.list_kernels=True --KernelGatewayApp.allow_origin='*'
fi
