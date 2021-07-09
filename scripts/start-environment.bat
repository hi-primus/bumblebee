IF exist ./packages/web/.env (
  IF exist ./packages/api/.env (
    set answer="n"
    set /p answer="Use localhost? [y/n] (default - %answer%):"
    IF "%answer%" == "y" (
      set localhost=True
    ) ELSE (
      set localhost=False
    )
    set alreadyinitialized=True
  ) ELSE goto :create
) ELSE (
  :create
  set answer=""
  set /p answer="Public address of current machine (leave blank to use localhost instead):"
  set alreadyinitialized=False
)

CALL stop-bumblebee.bat
CALL install-optimus.bat
CALL start-bumblebee.bat
CALL start-jupyter.bat
