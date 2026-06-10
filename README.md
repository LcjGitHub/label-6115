# 相机保养管理 MVP

全栈 MVP：相机列表 + 详情/保养记录管理。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TypeScript + MUI v6，端口 **6101** |
| 后端 | Express + TypeScript + better-sqlite3，端口 **6000** |
| 数据库 | `./backend/data/cameras.db`（SQLite，自动创建并 seed） |

## 快速启动

### 1. 安装依赖

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. 启动后端（端口 6000）

```bash
cd backend
npm run dev
```

### 3. 启动前端（端口 6101）

新开一个终端：

```bash
cd frontend
npm run dev
```

浏览器访问：**http://localhost:6101**

## 功能说明

- **页面 1 — 相机列表**：MUI DataGrid 展示所有相机，支持新增、删除，点击行进入详情
- **页面 2 — 相机详情**：编辑相机信息（型号、购入日期、预估快门数、备注）
- **保养记录**：同页 MUI List 展示，支持添加、删除保养记录

## 初始数据

启动后端时自动写入 2 台相机，各 2 条保养记录：

- Canon EOS R5
- Sony A7 IV

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/cameras` | 相机列表 |
| GET | `/api/cameras/:id` | 相机详情 |
| POST | `/api/cameras` | 新增相机 |
| PUT | `/api/cameras/:id` | 更新相机 |
| DELETE | `/api/cameras/:id` | 删除相机 |
| GET | `/api/cameras/:id/maintenance` | 保养记录列表 |
| POST | `/api/cameras/:id/maintenance` | 新增保养记录 |
| DELETE | `/api/maintenance/:id` | 删除保养记录 |
