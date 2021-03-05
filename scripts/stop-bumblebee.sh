pm2 stop web || true
pm2 stop api || true
pm2 delete web || true
pm2 delete api || true
