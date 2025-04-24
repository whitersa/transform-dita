# 全栈应用 (Node.js + React)

一个最小化的全栈应用，使用Express后端和React前端。

## 目录结构

```
/
├── server.js         # 后端入口文件
├── package.json      # 项目根配置
├── client/           # 前端React应用
│   ├── public/       # 静态文件
│   ├── src/          # 源代码
│   ├── .env          # 环境配置（设置端口）
│   └── package.json  # 前端配置
└── README.md         # 项目说明
```

## 安装

1. 安装所有依赖（前端和后端）:
```
npm run install:all
```

## 开发模式

同时启动前端和后端开发服务器:
```
npm run dev
```

这将启动:
- 后端服务器: http://localhost:3000
- 前端开发服务器: http://localhost:3001

分别启动:
```
# 只启动后端
npm run dev:server

# 只启动前端
npm run dev:client
```

## 生产构建

构建前端并运行生产模式的服务器:
```
npm run build
npm start
```

## API端点

- `GET /api` - 欢迎消息
- `GET /api/hello` - 示例接口
- `POST /api/data` - 用于提交数据的接口

## 使用示例

### 使用curl:

```bash
# 获取欢迎消息
curl http://localhost:3000/api

# 获取hello消息
curl http://localhost:3000/api/hello

# 提交数据
curl -X POST -H "Content-Type: application/json" -d '{"name":"张三","message":"你好世界"}' http://localhost:3000/api/data
``` 