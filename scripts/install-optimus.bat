set answer="n"
set /p answer="Install spark support? [y/n] (default - %answer%):"
IF "%answer%" == "y" (
  set spark=True
) ELSE (
  set spark=False
)

set coiled=False
set coiledgpu=False
set rapids=False

if %coiled% == True (
  echo Getting conda env from optimus/default on Coiled
  coiled install optimus/default
  conda activate coiled-optimus-default
) ELSE IF %coiledgpu% == True (
  echo Getting conda env from optimus/default on Coiled
  coiled install optimus/gpu
  conda activate coiled-optimus-gpu
) ELSE IF %rapids% == True (
  echo Creating rapids conda env
  conda create --name rapids-0.17
  conda activate coiled-optimus-gpu
)

IF %rapids% == True (
  echo Installing rapids support
  conda install -c rapidsai -c nvidia -c conda-forge -c defaults rapids-blazing=0.17 python=3.7 cudatoolkit=10.2
)

pip install git+https://github.com/hi-primus/dateinfer.git
pip install cytoolz

IF %spark% == True (
  echo Installing optimus with Spark support
  pip install --upgrade git+https://github.com/hi-primus/optimus.git@develop-22.2#egg=pyoptimus[spark]
) ELSE (
  echo Installing optimus
  pip install --upgrade git+https://github.com/hi-primus/optimus.git@develop-22.2
)
