import React, { useState, useCallback } from 'react';
import axios from 'axios'; // Re-enable axios
import './App.css';
import TextInputArea from './components/TextInputArea';
import ProcessingArea from './components/ProcessingArea';

function App() {
    const [inputText, setInputText] = useState(''); // Start empty
    const [processingResult, setProcessingResult] = useState({
        status: '',
        content: '',
        fileInfo: null,
        contentStats: null
    });
    // Loading state management: 'idle', 'preprocessing', 'finalizing', 'done'
    const [loadingStep, setLoadingStep] = useState('idle');


    const handleInputChange = useCallback((event) => {
        setInputText(event.target.value);
        // Reset results only if idle (after processing completes or before starting)
        if (loadingStep === 'idle') {
            setProcessingResult({
                status: '',
                content: '',
                fileInfo: null,
                contentStats: null
            });

        }
    }, [loadingStep]);

    const handleProcess = useCallback(async () => {
        if (!inputText.trim() || loadingStep !== 'idle') return;


        setLoadingStep('preprocessing'); // Start preprocessing
        setProcessingResult({
            status: '',
            content: '',
            fileInfo: null,
            contentStats: null
        });


        try {
            // 获取粘贴区域的innerHTML
            const pasteArea = document.querySelector('.text-area');
            const rtfContent = pasteArea.innerHTML
            console.log(rtfContent)
            // Call backend for preprocessing
            const response = await axios.post('http://localhost:3001/api/process', {

                rtfContent: rtfContent
            });

            // Store processing results with new information
            setProcessingResult({
                status: response.data.processingSteps || '未知状态',
                content: response.data.outputText || '无输出内容',
                fileInfo: response.data.fileInfo || null,
                contentStats: response.data.contentStats || null
            });

            setLoadingStep('idle');

        } catch (err) {
            console.error('API处理错误:', err);
            let errorMsg = '处理过程中发生错误。请检查后端服务是否运行以及网络连接。';
            if (err.response) {
                errorMsg = `服务器错误: ${err.response.data?.error || err.response.status}`;
            } else if (err.request) {
                errorMsg = '无法连接到服务器，请检查后端服务是否运行。';
            }
            alert(errorMsg);
            setProcessingResult({
                status: '',
                content: '',
                fileInfo: null,
                contentStats: null
            });

            setLoadingStep('idle');
        }
    }, [inputText, loadingStep]);


    return (
        <div className="App">
            <header className="App-header">
                <h1>DITA 转换工具 POC</h1>
            </header>
            <main className="App-main">
                <div className="processing-container">
                    <TextInputArea
                        value={inputText}
                        onChange={handleInputChange}
                        onProcess={handleProcess}
                        loadingStep={loadingStep}
                        // Disable button if not in idle state
                        disabled={loadingStep !== 'idle'}
                    />

                    <div className="processing-output-container">
                        <div className="area-container processing-area">
                            <ProcessingArea
                                result={processingResult}
                                isLoading={loadingStep === 'preprocessing'}
                                loadingStep={loadingStep}
                            />
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}

export default App; 