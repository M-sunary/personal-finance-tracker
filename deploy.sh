#!/bin/bash

# 个人财务管理器 - 一键部署脚本
# 使用方法: ./deploy.sh [platform]
# 平台选项: vercel | netlify | github

set -e

PLATFORM=${1:-vercel}
PROJECT_NAME="personal-finance-tracker"

echo "🚀 开始部署个人财务管理器到 $PLATFORM..."

# 检查是否有 Git 仓库
if [ ! -d ".git" ]; then
    echo "📝 初始化 Git 仓库..."
    git init
    git add .
    git commit -m "Initial commit: Personal Finance Tracker"
fi

# 检查是否有远程仓库
if ! git remote get-url origin >/dev/null 2>&1; then
    read -p "请输入你的 GitHub 用户名: " USERNAME
    echo "⚠️  请先在 GitHub 创建仓库: https://github.com/new"
    echo "仓库名建议使用: $PROJECT_NAME"
    read -p "创建完成后按回车继续..."
    
    git remote add origin "https://github.com/$USERNAME/$PROJECT_NAME.git"
fi

# 推送代码
echo "📤 推送代码到 GitHub..."
git add .
git commit -m "Deploy: Update for cloud deployment" || echo "No changes to commit"
git push -u origin main

case $PLATFORM in
    "vercel")
        echo "🔥 部署到 Vercel..."
        echo "1. 访问: https://vercel.com"
        echo "2. 用 GitHub 登录"
        echo "3. 点击 'New Project'"
        echo "4. 选择你的 $PROJECT_NAME 仓库"
        echo "5. 点击 'Deploy'"
        echo ""
        echo "✅ Vercel 会自动识别 React 项目并配置！"
        ;;
    "netlify")
        echo "🌐 部署到 Netlify..."
        echo "1. 访问: https://netlify.com"
        echo "2. 用 GitHub 登录"
        echo "3. 点击 'New site from Git'"
        echo "4. 选择 GitHub 并授权"
        echo "5. 选择你的 $PROJECT_NAME 仓库"
        echo "6. 点击 'Deploy site'"
        echo ""
        echo "✅ Netlify 会读取 netlify.toml 配置文件！"
        ;;
    "github")
        echo "📄 部署到 GitHub Pages..."
        echo "1. 访问: https://github.com/$USERNAME/$PROJECT_NAME/settings/pages"
        echo "2. Source 选择 'GitHub Actions'"
        echo "3. GitHub Actions 会自动部署"
        echo "4. 访问: https://$USERNAME.github.io/$PROJECT_NAME"
        echo ""
        echo "✅ GitHub Actions 工作流已配置！"
        ;;
    *)
        echo "❌ 不支持的平台: $PLATFORM"
        echo "支持的平台: vercel, netlify, github"
        exit 1
        ;;
esac

# 运行构建测试
echo "🔨 测试构建..."
npm run build

echo ""
echo "🎉 部署准备完成！"
echo "📱 你的财务管理器即将在云端可用！"
echo ""
echo "💡 提示："
echo "- 所有平台都支持自动部署（推送代码即更新）"
echo "- 记得在应用中定期导出数据备份"
echo "- 可以在部署平台设置自定义域名"
echo ""