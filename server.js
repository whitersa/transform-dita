const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { JSDOM } = require('jsdom');

const app = express();
const PORT = 3001; // 前端调用的端口

// 目录常量
const INPUT_DIR = path.join(__dirname, 'temp', 'input');
const OUTPUT_DIR = path.join(__dirname, 'temp', 'output');
const LOG_DIR = path.join(__dirname, 'temp', 'log'); // 新增日志目录
const FINAL_DIR = path.join(__dirname, 'temp', 'final'); // 新增最终输出目录

// 保证目录存在
[INPUT_DIR, OUTPUT_DIR, LOG_DIR, FINAL_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 中间件
app.use(cors()); // 允许跨域
app.use(express.json({ limit: '2mb' })); // 解析 JSON


// 将HTML内容转换为标准格式
function convertToStandardHtml(content) {
  // 创建一个新的JSDOM实例来解析HTML
  const dom = new JSDOM(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${content}</body></html>`);
  const document = dom.window.document;

  // 清理Word特定的元素和属性
  const removeAttributes = (element) => {
    // 移除所有style属性
    element.removeAttribute('style');
    // 移除所有class属性
    element.removeAttribute('class');
    // 移除Word特定的属性
    element.removeAttribute('lang');
    element.removeAttribute('align');

    // 递归处理所有子元素
    Array.from(element.children).forEach(removeAttributes);
  };

  // 从body开始清理
  removeAttributes(document.body);

  // 移除空的span标签
  const spans = document.getElementsByTagName('span');
  Array.from(spans).forEach(span => {
    if (!span.textContent.trim()) {
      span.remove();
    }
  });

  // 移除注释节点
  const removeComments = (node) => {
    const childNodes = node.childNodes;
    for (let i = childNodes.length - 1; i >= 0; i--) {
      const child = childNodes[i];
      if (child.nodeType === 8) { // 8 是注释节点的类型
        child.remove();
      } else if (child.nodeType === 1) { // 1 是元素节点的类型
        removeComments(child);
      }
    }
  };
  removeComments(document.body);

  // 获取处理后的HTML内容
  const cleanHtml = document.body.innerHTML;

  // 构建最终的HTML文档
  return `<!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <title>转换文档</title>
              </head>
              <body>
                ${cleanHtml}
              </body>
            </html>`;
}

// ---- 日志函数 ----
function appendLog({ htmlPath, luaOutPath, finalOutPath, text, errorMsg, errorDetail, errorStack }) {
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    const logPath = path.join(LOG_DIR, `${dateStr}.log`);
    const timeStr = new Date().toISOString();
    const logLines = [
      `[${timeStr}]`,
      `input: ${htmlPath}`,
      `pandoc output: ${luaOutPath}`,
      finalOutPath ? `final output: ${finalOutPath}` : '',
      errorMsg ? `error: ${errorMsg}` : '',
      errorDetail ? `detail: ${errorDetail}` : '',
      errorStack ? `stack: ${errorStack}` : '',
      text,
      '',
      ''
    ].join('\n');
    fs.appendFileSync(logPath, logLines, 'utf8');
  } catch (e) {
    console.error('写日志失败:', e);
  }
}

// 包装 exec 为 Promise
function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('执行命令失败:', stderr || error.message);
        return reject(error);
      }
      console.log('命令输出:', stdout);
      resolve(stdout);
    });
  });
}

/**********************
 *  处理文本 API
 *  POST /api/process
 *  body: { text: string }
 *  返回: { processingSteps: string, outputText: string }
 **********************/
app.post('/api/process', async (req, res) => {
  const { rtfContent } = req.body;

  if (!rtfContent) {
    return res.status(400).json({ error: 'No content provided' });
  }

  const timestamp = Date.now().toString();
  const baseName = `${timestamp}`;
  const htmlPath = path.join(INPUT_DIR, `preprocess_${baseName}.html`);
  const luaOutPath = path.join(OUTPUT_DIR, `pandoc_${baseName}.dita`);
  const finalOutPath = path.join(FINAL_DIR, `dita_${baseName}.dita`);

  try {
    // 将rtfContent转换为标准HTML并保存
    const standardHtml = convertToStandardHtml(rtfContent);
    fs.writeFileSync(htmlPath, standardHtml, 'utf8');
    console.log(`[Backend] 已保存标准化HTML: ${htmlPath}`);

    let processingSteps = [`1. 已将内容转换为标准HTML格式: ${htmlPath}`];

    // Pandoc转换
    const pandocCmd = `pandoc "${htmlPath}" -f html -t topic.lua -o "${luaOutPath}"`;
    console.log('[Backend] 执行pandoc:', pandocCmd);

    await execPromise(pandocCmd);
    console.log('[Backend] Pandoc转换完成，输出文件:', luaOutPath);
    processingSteps.push(`2. HTML通过Pandoc转换为DITA: ${luaOutPath}`);

    // DITA处理
    const ditaCmd = `dita -i="${luaOutPath}" -f=dita -o="${FINAL_DIR}"`;
    console.log('[Backend] 执行DITA处理:', ditaCmd);

    await execPromise(ditaCmd);
    console.log('[Backend] DITA处理完成，最终输出文件:', finalOutPath);

    // 读取最终转换后的文件内容
    const finalFileName = path.basename(luaOutPath);
    const finalFilePath = path.join(FINAL_DIR, finalFileName);
    const outputText = fs.readFileSync(finalFilePath, 'utf8');

    // 获取文件信息
    const stats = fs.statSync(finalFilePath);
    const fileInfo = {
      size: (stats.size / 1024).toFixed(2) + ' KB',
      created: stats.birthtime.toLocaleString(),
      modified: stats.mtime.toLocaleString(),
      path: finalFilePath
    };

    // 分析DITA内容
    const topicCount = (outputText.match(/<topic\b/g) || []).length;
    const imageCount = (outputText.match(/<image\b/g) || []).length;
    const tableCount = (outputText.match(/<table\b/g) || []).length;
    const contentStats = {
      topics: topicCount,
      images: imageCount,
      tables: tableCount,
      totalLength: outputText.length
    };

    // 记录成功日志
    appendLog({ htmlPath, luaOutPath, finalOutPath: finalFilePath, text: standardHtml });

    processingSteps = processingSteps.concat([
      `3. DITA处理完成: ${finalFilePath}`,
      '',
      '最终文件信息:',
      `- 文件大小: ${fileInfo.size}`,
      `- 创建时间: ${fileInfo.created}`,
      `- 修改时间: ${fileInfo.modified}`,
      '',
      'DITA内容统计:',
      `- 主题数量: ${contentStats.topics}`,
      `- 图片数量: ${contentStats.images}`,
      `- 表格数量: ${contentStats.tables}`,
      `- 总字符数: ${contentStats.totalLength}`
    ]);

    return res.json({
      processingSteps: processingSteps.join('\n'),
      outputText,
      fileInfo,
      contentStats
    });

  } catch (err) {
    console.error('处理出错:', err);
    appendLog({
      htmlPath, luaOutPath, finalOutPath, text: rtfContent,
      errorMsg: err.message,
      errorDetail: err.detail,
      errorStack: err.stack
    });
    return res.status(500).json({ error: err.message || 'Internal server error during processing' });
  }
});

/**********************
 * 生产环境：提供前端构建文件
 **********************/
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'build')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
  console.log(`POST http://localhost:${PORT}/api/process`);
});