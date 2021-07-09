@echo off
cd scripts

CALL dependencies.bat

IF "%1" == "start" (

    IF "%2" == "jupyter" (
      CALL start-jupyter.bat
    ) ELSE IF "%2" == "bumblebee" (
      CALL start-bumblebee.bat
    ) ELSE (
      CALL start-environment.bat
    )

) ELSE IF "%1" == "restart" (

    IF "%2" == "jupyter" (
      CALL restart-jupyter.bat
    ) ELSE IF "%2" == "bumblebee" (
      CALL restart-bumblebee.bat
    ) ELSE (
      CALL restart-environment.bat
    )

) ELSE IF "%1" == "install" (

    IF "%2" == "optimus" (
      CALL install-optimus.bat
    ) ELSE IF "%2" == "bumblebee" (
      CALL install-bumblebee.bat
    ) ELSE (
      CALL install-environment.bat
    )

) ELSE IF "%1" == "update" (

    IF "%2" == "optimus" (
      CALL update-optimus.bat
    ) ELSE IF "%2" == "bumblebee" (
      CALL update-bumblebee.bat
    ) ELSE (
      CALL update-environment.bat
    )

) ELSE IF "%1" == "stop" (

    IF "%2" == "bumblebee" (
      CALL stop-bumblebee.bat
    ) ELSE (
      ECHO "Unknown parameter, did you mean 'bbi stop bumblebee'?"
    )

) ELSE (
    ECHO "Unknown parameter, try 'bbi install environment'"
)
