set answer="n"
set /p answer="Use localhost? [y/n] (default - %answer%):"
IF "%answer%" == "y" (
  set localhost=True
) ELSE (
  set localhost=False
)
CALL restart-bumblebee.bat
CALL restart-jupyter.bat
