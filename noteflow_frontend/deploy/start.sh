#!/bin/sh
# 等待后端健康检查通过
until curl -s "http://backend:${BACKEND_PORT}/health" > /dev/null; do
    echo "等待后端服务就绪..."
    sleep 2
done

# 生成 nginx 配置文件（动态变量替换）
envsubst '${BACKEND_HOST} ${BACKEND_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# 启动 Nginx（在前台运行）
exec nginx -g 'daemon off;'