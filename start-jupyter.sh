
cd
pip install --upgrade --force-reinstall git+https://github.com/ironmussa/Optimus.git@optimus_dataframe
pip3 install --upgrade --force-reinstall git+https://github.com/ironmussa/Optimus.git@optimus_dataframe
if [ -z "$address" || "$localhost" = false ]
then
  jupyter kernelgateway --JupyterWebsocketPersonality.list_kernels=True
else
  jupyter kernelgateway --ip=0.0.0.0 --JupyterWebsocketPersonality.list_kernels=True --KernelGatewayApp.allow_origin='*'
fi
