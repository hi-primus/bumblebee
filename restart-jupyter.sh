echo 'Use localhost? [y/N]'
cd
if [ "$localhost" = true ]
then
  jupyter kernelgateway --JupyterWebsocketPersonality.list_kernels=True
else
  jupyter kernelgateway --ip=0.0.0.0 --JupyterWebsocketPersonality.list_kernels=True --KernelGatewayApp.allow_origin='*'
fi
