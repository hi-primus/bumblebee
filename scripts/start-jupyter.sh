#!/bin/bash
if [[ -z "$address" || "$localhost" = false ]]; then
  jupyter kernelgateway --JupyterWebsocketPersonality.list_kernels=True
else
  jupyter kernelgateway --ip=0.0.0.0 --JupyterWebsocketPersonality.list_kernels=True --KernelGatewayApp.allow_origin='*' --Application.log_level=50
fi
