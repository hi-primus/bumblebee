_use_time = True
try:
    _start_time = datetime.utcnow().timestamp()
except Exception:
    _use_time = False  