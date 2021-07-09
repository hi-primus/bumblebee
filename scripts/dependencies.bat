call conda --version >nul 2>&1 && ( echo Conda: ok) || ( echo Warning: Conda not found.)
call pip --version >nul 2>&1 && ( echo Pip: ok ) || ( echo Warning: pip not found.)