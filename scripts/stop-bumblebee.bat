pm2 stop web || echo "Not found"
pm2 stop api || echo "Not found"
pm2 delete web || echo "Not found"
pm2 delete api || echo "Not found"
