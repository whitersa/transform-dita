import React from 'react';

// Removed SkeletonLoader component

const ProcessingArea = ({ result, isLoading, loadingStep }) => {
  // 在预处理阶段显示加载动画
  const showCardOverlay = loadingStep === 'preprocessing';
  // 检查 result 对象是否有内容或状态
  const hasData = result && (result.status || result.content || result.fileInfo || result.contentStats);
  // 当不处于加载状态且有数据时，显示内容区域
  const showContentArea = hasData && loadingStep !== 'preprocessing';

  // 格式化文件信息显示
  const renderFileInfo = (fileInfo) => {
    if (!fileInfo) return null;
    return (
      <div className="file-info">
        <h3>文件信息</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>大小：</label>
            <span>{fileInfo.size}</span>
          </div>
          <div className="info-item">
            <label>创建时间：</label>
            <span>{fileInfo.created}</span>
          </div>
          <div className="info-item">
            <label>修改时间：</label>
            <span>{fileInfo.modified}</span>
          </div>
          <div className="info-item">
            <label>路径：</label>
            <span className="file-path">{fileInfo.path}</span>
          </div>
        </div>
      </div>
    );
  };

  // 格式化内容统计信息显示
  const renderContentStats = (stats) => {
    if (!stats) return null;
    return (
      <div className="content-stats">
        <h3>内容统计</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <label>主题数量：</label>
            <span>{stats.topics}</span>
          </div>
          <div className="stat-item">
            <label>图片数量：</label>
            <span>{stats.images}</span>
          </div>
          <div className="stat-item">
            <label>表格数量：</label>
            <span>{stats.tables}</span>
          </div>
          <div className="stat-item">
            <label>总字符数：</label>
            <span>{stats.totalLength}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Render overlay directly inside the fragment,
          it will be positioned relative to the parent .processing-area */}
      {showCardOverlay && <div className="card-loading-overlay"></div>}
      <div className="area-header">
        <span>处理状态</span>
        {/* Keep header status as subtle indicator if desired */}
        {/* {isLoading && <span className="processing-status">处理中...</span>} */}
      </div>
      <div className="area-content">
        {showContentArea ? (
          <div className="processing-result">
            {/* 处理步骤 */}
            {result.status && (
              <div className="processing-steps">
                <h3>处理步骤</h3>
                <pre className="steps-content">{result.status}</pre>
              </div>
            )}
            
            {/* 文件信息 */}
            {renderFileInfo(result.fileInfo)}
            
            {/* 内容统计 */}
            {renderContentStats(result.contentStats)}
            
            {/* DITA内容预览 */}
            {result.content && (
              <div className="dita-preview">
                <h3>DITA内容预览</h3>
                <pre className="content-preview">{result.content}</pre>
              </div>
            )}
          </div>
        ) : (
          // 只有在完全空闲且无数据时显示空状态
          loadingStep === 'idle' && !hasData && (
            <div className="empty-state">
              <p>处理结果将显示在此处。</p>
              <small>在左侧输入文本并点击"处理"按钮开始。</small>
            </div>
          )
        )}
        {/* No skeleton loader needed */}
      </div>
    </>
  );
};

export default ProcessingArea; 