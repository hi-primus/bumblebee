IF "%address%" == "" (
  IF %localhost% == False (
    jupyter kernelgateway --JupyterWebsocketPersonality.list_kernels=True
  ) ELSE ( goto :network )
) ELSE (
  :network
  jupyter kernelgateway --ip=0.0.0.0 --JupyterWebsocketPersonality.list_kernels=True --KernelGatewayApp.allow_origin='*' --Application.log_level=50
)
