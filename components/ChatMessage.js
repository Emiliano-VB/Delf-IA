import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Un mensaje del chat. Renderiza Markdown y fórmulas LaTeX ($...$ y $$...$$).
export default function ChatMessage({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`msg ${isUser ? 'user' : 'assistant'}`}>
      <div className="avatar" aria-hidden="true">
        {isUser ? '🧑' : '🐬'}
      </div>
      <div className="bubble">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
