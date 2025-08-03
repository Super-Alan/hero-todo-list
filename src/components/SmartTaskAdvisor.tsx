import React from 'react';
import ReactMarkdown from 'react-markdown';

interface SmartTaskAdvisorProps {
  advice: string;
  isLoading: boolean;
}

const SmartTaskAdvisor: React.FC<SmartTaskAdvisorProps> = ({ advice, isLoading }) => {
  if (isLoading) {
    return (
      <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700 animate-pulse">
        正在分析任务，请稍候...
      </div>
    );
  }

  if (!advice) {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700">
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-base font-semibold mb-1" {...props} />,
          strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc list-inside pl-2 mb-2" {...props} />,
          li: ({node, ...props}) => <li className="mb-1" {...props} />,
        }}
      >
        {advice}
      </ReactMarkdown>
    </div>
  );
};

export default SmartTaskAdvisor;