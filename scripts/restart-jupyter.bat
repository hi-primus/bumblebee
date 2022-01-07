IF %localhost% == True (
  jupyter kernelgateway --JupyterWebsocketPersonality.list_kernels=True
) ELSE (
  jupyter kernelgateway --ip=0.0.0.0 --JupyterWebsocketPersonality.list_kernels=True --KernelGatewayApp.allow_origin=* --Application.log_level=50
)
