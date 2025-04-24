import React, { useRef, useEffect } from 'react';

const TextInputArea = ({ value, onChange, onProcess, disabled, loadingStep }) => {
  const contentRef = useRef(null);
  const showCardOverlay = loadingStep === 'preprocessing' || loadingStep === 'finalizing';

  // 解码HTML内容
  const decodeHtml = (html) => {
    // 创建一个新的DOMParser实例
    const parser = new DOMParser();
    // 解析HTML字符串
    const doc = parser.parseFromString(html, 'text/html');
    // 返回body内容
    return doc.body.innerHTML;
  };

  // 处理粘贴事件
  const handlePaste = (e) => {
    e.preventDefault();
    
    let content = '';
    
    // 优先使用HTML格式
    if (e.clipboardData.types.includes('text/html')) {
      content = e.clipboardData.getData('text/html');
      
      // 使用DOMParser解析和清理HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      
      // 获取body内容
      content = doc.body.innerHTML;
      
      // 移除多余的空白字符但保留基本格式
      content = content.replace(/[\t\n\r]+/g, ' ').trim();
      
    } else if (e.clipboardData.types.includes('text/plain')) {
      // 处理纯文本
      content = e.clipboardData.getData('text/plain')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r\n|\r|\n/g, '<br>');
    }

    // 使用execCommand插入内容
    document.execCommand('insertHTML', false, content);

    // 触发onChange事件
    if (contentRef.current) {
      onChange({
        target: {
          value: contentRef.current.innerHTML
        }
      });
    }
  };

  // 处理内容变化
  const handleInput = () => {
    if (contentRef.current) {
      // 获取当前内容并处理转义字符
      let currentHtml = contentRef.current.innerHTML;
      currentHtml = currentHtml.replace(/\\n/g, '').replace(/\n/g, '');
      
      onChange({
        target: {
          value: currentHtml
        }
      });
    }
  };

  // 同步外部value到contentEditable
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== value) {
      // 处理可能的转义字符
      const processedValue = value ? value.replace(/\\n/g, '').replace(/\n/g, '') : '';
      contentRef.current.innerHTML = processedValue;
    }
  }, [value]);

  // DEBUGGING LOG
  console.log('[TextInputArea] Render - loadingStep:', loadingStep, 'showCardOverlay:', showCardOverlay);

  return (
    <div className="area-container input-area">
      {showCardOverlay && <div className="card-loading-overlay"></div>}

      <div className="area-header">
        <span>输入区域</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              id="useHtml"
              name="useHtml"
              onChange={(e) => window.localStorage.setItem('useHtml', e.target.checked)}
              defaultChecked={window.localStorage.getItem('useHtml') === 'true'}
            />
            使用HTML
          </label>
          <label style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              id="onlyBody"
              name="onlyBody"
              onChange={(e) => window.localStorage.setItem('onlyBody', e.target.checked)}
              defaultChecked={window.localStorage.getItem('onlyBody') === 'true'}
            />
            仅返回Body
          </label>
          <button
            className="header-button"
            onClick={onProcess}
            disabled={disabled || !value.trim()}
          >
            {loadingStep === 'preprocessing' ? '处理中...' : '开始处理'}
          </button>
        </div>
      </div>
      <div className="area-content">
        <div
          // 使用 key 强制重新挂载 div
          // 当 value 变化时，React 会销毁旧 div 并创建一个新 div
          // 这可以解决 contentEditable 的状态同步问题
          key={value}
          ref={contentRef}
          className="text-area"
          contentEditable={!showCardOverlay}
          onPaste={handlePaste}
          onInput={handleInput}
          placeholder="在此处粘贴Word文档内容..."
          suppressContentEditableWarning={true}
        // dangerouslySetInnerHTML 仍然不是必需的，key 会处理初始化
        />
      </div>
    </div>
  );
};

export default TextInputArea;
