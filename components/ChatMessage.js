import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Un mensaje del chat. Renderiza Markdown y fórmulas LaTeX ($...$ y $$...$$).
// Marcas internas del tutor ([[ej:...]] / [[ok:...]]): se guardan en el historial pero no se muestran.
const HIDDEN = /\[\[(?:ej|ok):[^\]]*\]\]/g;

export default function ChatMessage({ role, content }) {
  const shown = String(content || '').replace(HIDDEN, '').trim();
  const isUser = role === 'user';
  return (
    <div className={`msg ${isUser ? 'user' : 'assistant'}`}>
      <div className="avatar" aria-hidden="true">
        {isUser ? '🧑' : '🐬'}
      </div>
      <div className="bubble">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {shown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
